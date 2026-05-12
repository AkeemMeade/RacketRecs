#!/usr/bin/env python3
"""
Test Notification System

This script helps you test the notification system by:
1. Manually marking a racket as out of stock
2. Then marking it back in stock
3. Creating notifications for users who favorited it

Usage:
    python scripts/test_notifications.py --racket-id 123 --retailer-id 2
"""

import os
import argparse
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Load environment
load_dotenv(Path(__file__).resolve().parents[1] / '.env.local')


def main():
    parser = argparse.ArgumentParser(description='Test notification system')
    parser.add_argument('--racket-id', type=int, required=True, 
                        help='Racket ID to test with')
    parser.add_argument('--retailer-id', type=int, required=True,
                        help='Retailer ID to test with (1=yumo, 2=joybadminton, 3=therallyshop)')
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
    print("NOTIFICATION SYSTEM TEST")
    print("=" * 70)
    print(f"Racket ID: {args.racket_id}")
    print(f"Retailer ID: {args.retailer_id}\n")
    
    # Step 1: Find the racket_retailer entry
    print("1. Finding racket_retailer entry...")
    try:
        response = supabase.table('racket_retailer').select("""
            id,
            in_stock,
            racket (name),
            retailer (name)
        """).eq('racket_id', args.racket_id).eq(
            'retailer_id', args.retailer_id
        ).execute()
        
        if not response.data:
            print(f"    No entry found for racket {args.racket_id} at retailer {args.retailer_id}")
            return
        
        entry = response.data[0]
        entry_id = entry['id']
        racket_name = entry['racket']['name']
        retailer_name = entry['retailer']['name']
        current_stock = entry['in_stock']
        
        print(f"    Found: {racket_name} at {retailer_name}")
        print(f"   Current stock status: {'IN STOCK' if current_stock else 'OUT OF STOCK'}")
    
    except Exception as e:
        print(f"    Error: {e}")
        return
    
    # Step 2: Find users who favorited this racket
    print("\n2. Finding users who favorited this racket...")
    try:
        fav_response = supabase.table('favorites').select('user_id').eq(
            'racket_id', args.racket_id
        ).execute()
        
        users = [fav['user_id'] for fav in fav_response.data]
        print(f"    Found {len(users)} users who favorited this racket")
        
        if len(users) == 0:
            print("\n  WARNING: No users have favorited this racket!")
            print("   You should favorite it first in the UI to test notifications.")
            cont = input("\n   Continue anyway? (yes/no): ").lower()
            if cont not in ['yes', 'y']:
                return
    
    except Exception as e:
        print(f"    Error: {e}")
        return
    
    # Step 3: Mark as OUT OF STOCK (if currently in stock)
    if current_stock:
        print("\n3. Marking racket as OUT OF STOCK...")
        try:
            supabase.table('racket_retailer').update({
                'in_stock': False,
                'last_checked': datetime.now().isoformat()
            }).eq('id', entry_id).execute()
            print("    Marked as OUT OF STOCK")
            current_stock = False
        except Exception as e:
            print(f"    Error: {e}")
            return
    else:
        print("\n3. Racket is already OUT OF STOCK, skipping...")
    
    # Step 4: Mark as IN STOCK (simulate restock)
    print("\n4. Marking racket as IN STOCK (simulating restock)...")
    try:
        supabase.table('racket_retailer').update({
            'in_stock': True,
            'last_checked': datetime.now().isoformat()
        }).eq('id', entry_id).execute()
        print("    Marked as IN STOCK")
    except Exception as e:
        print(f"    Error: {e}")
        return
    
    # Step 5: Create notifications for each user
    print("\n5. Creating notifications for users...")
    notifications_created = 0
    
    for user_id in users:
        try:
            # Check if notification already exists
            existing = supabase.table('stock_notifications').select('id').eq(
                'user_id', user_id
            ).eq('racket_id', args.racket_id).eq(
                'retailer_id', args.retailer_id
            ).eq('read', False).execute()
            
            if existing.data:
                print(f"     Notification already exists for user {user_id[:8]}...")
                continue
            
            # Create notification
            supabase.table('stock_notifications').insert({
                'user_id': user_id,
                'racket_id': args.racket_id,
                'retailer_id': args.retailer_id,
                'notification_type': 'back_in_stock',
                'read': False
            }).execute()
            
            notifications_created += 1
            print(f"    Created notification for user {user_id[:8]}...")
        
        except Exception as e:
            print(f"    Error for user {user_id[:8]}: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Racket: {racket_name}")
    print(f"Retailer: {retailer_name}")
    print(f"Users who favorited: {len(users)}")
    print(f"Notifications created: {notifications_created}")
    print("\n Test complete!")
    print("\nNext steps:")
    print("1. Refresh the UI - you should see a notification badge on Favorites")
    print("2. Click on Favorites to see the notification")
    print("3. Check your favorites page for the stock update")
    print("=" * 70)


if __name__ == "__main__":
    main()