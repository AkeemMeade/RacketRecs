#!/usr/bin/env python3
"""
Clean up racket names in the database.
Fixes names that have dashes, "badminton", "unstrung", etc.

Usage:
    python scripts/cleanup_racket_names.py --dry-run  # Preview changes
    python scripts/cleanup_racket_names.py            # Apply changes
"""

import os
import re
from pathlib import Path
from dotenv import load_dotenv
import argparse

# Load environment
load_dotenv(Path(__file__).resolve().parents[1] / '.env.local')


def clean_racket_name(name: str) -> str:
    """
    Clean a racket name by:
    1. Removing dashes and converting to title case with spaces
    2. Removing noise words like "badminton", "unstrung", etc.
    3. Removing weight/grip codes
    4. Removing parentheses content 
    """
    # Start with original name
    cleaned = name
    
    # Remove parentheses and their content
    cleaned = re.sub(r'\s*\([^)]*\)\s*', ' ', cleaned)
    
    # Convert dashes to spaces
    cleaned = cleaned.replace('-', ' ')
    
    # Remove noise words (case insensitive)
    noise_words = [
        'badminton', 'racket', 'racquet', 'racquette',
        'unstrung', 'strung',
        'store', 'official', 'authentic',
        'edition', 'version', 'original',
    ]
    
    for word in noise_words:
        # Use word boundaries to avoid removing parts of other words
        cleaned = re.sub(rf'\b{word}\b', '', cleaned, flags=re.IGNORECASE)
    
    # Remove weight/grip codes like "4U", "3UG5", "G5", "AYPU015-3", etc.
    weight_patterns = [
        r'\b\d*U\d*\b',           # 3U, 4U, 5U
        r'\b\d*UG\d+\b',          # 3UG5, UG4
        r'\bG\d+\b',              # G5, G6
        r'\bAYPU\d+-\d+\b',       # AYPU015-3
        r'\b\d+UG\d+\b',          # 4UG5
    ]
    
    for pattern in weight_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # Remove standalone numbers at the end (like product codes)
    # But keep numbers that are part of model names (like "Astrox 88")
    # cleaned = re.sub(r'\s+\d+$', '', cleaned)
    
    # Clean up multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Apply title case
    cleaned = cleaned.title()
    
    return cleaned


def needs_cleaning(name: str) -> bool:
    """
    Check if a name needs cleaning.
    Returns True if the name has issues.
    """
    indicators = [
        '-' in name,  # Has dashes
        'badminton' in name.lower(),
        'unstrung' in name.lower(),
        'strung' in name.lower(),
        'racket' in name.lower(),
        bool(re.search(r'\d+[Uu]\d*', name)),  # Has weight codes like 3U, 4UG5
        '(' in name,  # Has parentheses
    ]
    
    return any(indicators)


def main():
    parser = argparse.ArgumentParser(description='Clean up racket names in the database')
    parser.add_argument('--dry-run', action='store_true', 
                        help='Preview changes without applying them')
    args = parser.parse_args()
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print(" Supabase credentials not found in .env.local")
        return
    
    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
    except ImportError:
        print(" supabase-py not installed. Run: pip install supabase")
        return
    
    print("=" * 70)
    print("RACKET NAME CLEANUP")
    print("=" * 70)
    
    # Fetch all rackets
    print("\n1. Fetching rackets from database...")
    try:
        response = supabase.table('racket').select('racket_id, name').execute()
        rackets = response.data
        print(f"    Found {len(rackets)} rackets")
    except Exception as e:
        print(f"    Error: {e}")
        return
    
    # Analyze which need cleaning
    print("\n2. Analyzing names...")
    needs_update = []
    
    for racket in rackets:
        racket_id = racket['racket_id']
        original_name = racket['name']
        
        if needs_cleaning(original_name):
            cleaned_name = clean_racket_name(original_name)
            
            # Only update if the cleaned name is actually different
            if cleaned_name != original_name:
                needs_update.append({
                    'id': racket_id,
                    'original': original_name,
                    'cleaned': cleaned_name,
                })
    
    print(f"   Found {len(needs_update)} names that need cleaning")
    
    if not needs_update:
        print("\n All racket names are already clean!")
        return
    
    # Show preview
    print("\n3. Preview of changes:")
    print("-" * 70)
    
    # Show first 20 changes
    for i, update in enumerate(needs_update[:20], 1):
        print(f"\n{i}. ID {update['id']}:")
        print(f"   Before: {update['original']}")
        print(f"   After:  {update['cleaned']}")
    
    if len(needs_update) > 20:
        print(f"\n   ... and {len(needs_update) - 20} more")
    
    print("\n" + "-" * 70)
    
    if args.dry_run:
        print("\n DRY RUN - No changes applied")
        print(f"   Run without --dry-run to apply {len(needs_update)} updates")
        return
    
    # Ask for confirmation
    print(f"\n  About to update {len(needs_update)} racket names")
    response = input("   Continue? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("    Cancelled")
        return
    
    # Apply updates
    print("\n4. Applying updates...")
    stats = {'success': 0, 'failed': 0}
    
    for update in needs_update:
        try:
            supabase.table('racket').update({
                'name': update['cleaned']
            }).eq('racket_id', update['id']).execute()
            
            stats['success'] += 1
            
            if stats['success'] % 50 == 0:
                print(f"    Updated {stats['success']}/{len(needs_update)}...")
        
        except Exception as e:
            print(f"    Failed to update ID {update['id']}: {e}")
            stats['failed'] += 1
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total analyzed:       {len(rackets)}")
    print(f"Needed cleaning:      {len(needs_update)}")
    print(f"Successfully updated: {stats['success']}")
    print(f"Failed:               {stats['failed']}")
    print("=" * 70)
    
    if stats['success'] > 0:
        print("\n Cleanup complete!")
        print("\nExamples of cleaned names:")
        for update in needs_update[:5]:
            print(f"   • {update['cleaned']}")


if __name__ == "__main__":
    main()