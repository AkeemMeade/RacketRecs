#!/usr/bin/env python3
"""
Fill NULL Racket Attributes

Fills missing balance, stiffness, and max_tension values based on racket series patterns.
Only updates rackets where the field is currently NULL.

Usage:
    python scripts/fill_racket_nulls.py --dry-run  # Preview changes
    python scripts/fill_racket_nulls.py            # Apply changes
"""

import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv(Path(__file__).resolve().parents[1] / '.env.local')


# Series-based defaults
BALANCE_RULES = [
    ('astrox', 'Head Heavy'),
    ('thruster', 'Head Heavy'),
    ('nanoflare', 'Head Light'),
    ('auraspeed', 'Head Light'),
    ('jetspeed', 'Head Light'),
    ('drivex', 'Even Balance'),
    ('brave sword', 'Even Balance'),
    ('arcsaber', 'Even Balance'),
]

STIFFNESS_RULES = [
    ('astrox', 'Stiff'),
    ('nanoflare', 'Stiff'),
    ('auraspeed', 'Stiff'),
    ('thruster', 'Stiff'),
    ('brave sword', 'Medium'),
    ('arcsaber', 'Medium'),
]

DEFAULT_MAX_TENSION = '28 lbs'
DEFAULT_STIFFNESS = 'Flexible'  # For rackets not matching any pattern


def determine_balance(name: str) -> str:
    """Determine balance based on racket name"""
    name_lower = name.lower()
    for pattern, balance in BALANCE_RULES:
        if pattern in name_lower:
            return balance
    return None  # No default for balance, leave as NULL


def determine_stiffness(name: str) -> str:
    """Determine stiffness based on racket name"""
    name_lower = name.lower()
    for pattern, stiffness in STIFFNESS_RULES:
        if pattern in name_lower:
            return stiffness
    return DEFAULT_STIFFNESS  # Default to Flexible for unknown series


def main():
    parser = argparse.ArgumentParser(description='Fill NULL racket attributes')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview changes without applying them')
    args = parser.parse_args()
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print(" Supabase credentials not found")
        return
    
    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
    except ImportError:
        print(" supabase-py not installed")
        return
    
    print("=" * 70)
    print("FILL NULL RACKET ATTRIBUTES")
    print("=" * 70)
    
    # Fetch all rackets
    print("\n1. Fetching rackets from database...")
    try:
        response = supabase.table('racket').select(
            'racket_id, name, balance, stiffness, max_tension'
        ).execute()
        rackets = response.data
        print(f"    Found {len(rackets)} rackets")
    except Exception as e:
        print(f"    Error: {e}")
        return
    
    # Analyze which need updates
    print("\n2. Analyzing NULL values...")
    updates = {
        'balance': [],
        'stiffness': [],
        'max_tension': [],
    }
    
    for racket in rackets:
        racket_id = racket['racket_id']
        name = racket['name']
        
        changes = {}
        
        # Check balance
        if racket['balance'] is None:
            new_balance = determine_balance(name)
            if new_balance:
                changes['balance'] = new_balance
                updates['balance'].append({
                    'id': racket_id,
                    'name': name,
                    'new_value': new_balance
                })
        
        # Check stiffness
        if racket['stiffness'] is None:
            new_stiffness = determine_stiffness(name)
            changes['stiffness'] = new_stiffness
            updates['stiffness'].append({
                'id': racket_id,
                'name': name,
                'new_value': new_stiffness
            })
        
        # Check max_tension
        if racket['max_tension'] is None:
            changes['max_tension'] = DEFAULT_MAX_TENSION
            updates['max_tension'].append({
                'id': racket_id,
                'name': name,
                'new_value': DEFAULT_MAX_TENSION
            })
    
    # Show summary
    print(f"\n   Balance (NULL): {len(updates['balance'])} rackets need updates")
    print(f"   Stiffness (NULL): {len(updates['stiffness'])} rackets need updates")
    print(f"   Max Tension (NULL): {len(updates['max_tension'])} rackets need updates")
    
    total_updates = sum(len(v) for v in updates.values())
    
    if total_updates == 0:
        print("\n No NULL values found! All rackets have complete data.")
        return
    
    # Show preview
    print("\n3. Preview of changes:")
    print("-" * 70)
    
    # Show balance updates
    if updates['balance']:
        print(f"\nBALANCE ({len(updates['balance'])} updates):")
        for item in updates['balance'][:10]:
            print(f"  {item['name'][:50]:50} → {item['new_value']}")
        if len(updates['balance']) > 10:
            print(f"  ... and {len(updates['balance']) - 10} more")
    
    # Show stiffness updates
    if updates['stiffness']:
        print(f"\nSTIFFNESS ({len(updates['stiffness'])} updates):")
        for item in updates['stiffness'][:10]:
            print(f"  {item['name'][:50]:50} → {item['new_value']}")
        if len(updates['stiffness']) > 10:
            print(f"  ... and {len(updates['stiffness']) - 10} more")
    
    # Show max_tension updates
    if updates['max_tension']:
        print(f"\nMAX TENSION ({len(updates['max_tension'])} updates):")
        for item in updates['max_tension'][:10]:
            print(f"  {item['name'][:50]:50} → {item['new_value']}")
        if len(updates['max_tension']) > 10:
            print(f"  ... and {len(updates['max_tension']) - 10} more")
    
    print("\n" + "-" * 70)
    
    if args.dry_run:
        print("\n DRY RUN - No changes applied")
        print(f"   Run without --dry-run to apply {total_updates} updates")
        return
    
    # Ask for confirmation
    print(f"\n  About to update {total_updates} NULL values")
    response = input("   Continue? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("    Cancelled")
        return
    
    # Apply updates
    print("\n4. Applying updates...")
    stats = {'success': 0, 'failed': 0}
    
    # Combine all updates by racket_id
    all_updates = {}
    
    for field in ['balance', 'stiffness', 'max_tension']:
        for item in updates[field]:
            racket_id = item['id']
            if racket_id not in all_updates:
                all_updates[racket_id] = {}
            all_updates[racket_id][field] = item['new_value']
    
    # Apply each update
    for racket_id, changes in all_updates.items():
        try:
            supabase.table('racket').update(changes).eq(
                'racket_id', racket_id
            ).execute()
            stats['success'] += 1
            
            if stats['success'] % 50 == 0:
                print(f"    Updated {stats['success']}/{len(all_updates)}...")
        
        except Exception as e:
            print(f"    Failed to update racket {racket_id}: {e}")
            stats['failed'] += 1
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total rackets analyzed:  {len(rackets)}")
    print(f"Rackets with NULL values: {len(all_updates)}")
    print(f"Successfully updated:    {stats['success']}")
    print(f"Failed:                  {stats['failed']}")
    print("=" * 70)
    
    if stats['success'] > 0:
        print("\n Update complete!")
        print("\nBreakdown:")
        print(f"  Balance updated:     {len(updates['balance'])}")
        print(f"  Stiffness updated:   {len(updates['stiffness'])}")
        print(f"  Max Tension updated: {len(updates['max_tension'])}")


if __name__ == "__main__":
    main()