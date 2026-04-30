#!/usr/bin/env python3
"""
Stock Availability Checker
Checks each racket in racket_retailer table for stock status.

This script:
1. Fetches all entries from racket_retailer
2. Scrapes each product URL to check stock status
3. Updates in_stock column based on availability
4. Logs changes for notification system

Usage:
    python scripts/check_stock.py
"""

import os
import time
from pathlib import Path
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Optional, List, Dict

# Load environment
load_dotenv(Path(__file__).resolve().parents[1] / '.env.local')


class StockChecker:
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize stock checker with Supabase connection"""
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.delay = 2  
        
        # Initialize Supabase
        self.supabase = None
        url = supabase_url or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = supabase_key or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if url and key:
            try:
                from supabase import create_client
                self.supabase = create_client(url, key)
                print(" Supabase connection initialized")
            except ImportError:
                print(" supabase-py not installed. Run: pip install supabase")
            except Exception as e:
                print(f" Could not connect to Supabase: {e}")
        else:
            print(" Supabase credentials not provided")
    
    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a page and return BeautifulSoup object"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            time.sleep(self.delay)  # Rate limiting
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"    Error fetching {url}: {e}")
            return None
    
    def check_yumo_stock(self, soup: BeautifulSoup) -> bool:
        """
        Check if a Yumo product is in stock.
        Looks for Shopify product JSON data with 'available' boolean.
        """
        import json
        import re
        
        # Method 1: Look for product JSON in script tags
        scripts = soup.find_all('script', type='application/json')
        for script in scripts:
            if script.string and 'product' in script.string.lower():
                try:
                    data = json.loads(script.string)
                    if 'available' in data:
                        return data['available']
                    # Sometimes nested in product object
                    if 'product' in data and 'available' in data['product']:
                        return data['product']['available']
                except:
                    continue
        
        # Method 2: Look for Shopify product object in inline scripts
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                # Look for patterns like: "available":true or 'available':true
                match = re.search(r'"available"\s*:\s*(true|false)', script.string, re.IGNORECASE)
                if match:
                    return match.group(1).lower() == 'true'
        
        # Method 3: Check meta tags
        availability_meta = soup.find('meta', {'property': 'product:availability'})
        if availability_meta:
            content = availability_meta.get('content', '').lower()
            return 'in stock' in content or 'instock' in content
        
        # Default to in stock if we can't determine
        print("   Could not find 'available' field, defaulting to IN STOCK")
        return True
    
    def check_joybadminton_stock(self, soup: BeautifulSoup) -> bool:
        """
        Check if a JoyBadminton product is in stock.
        Looks for Shopify product JSON data with 'available' boolean.
        """
        import json
        import re
        
        # Method 1: Look for product JSON in script tags
        scripts = soup.find_all('script', type='application/json')
        for script in scripts:
            if script.string and 'product' in script.string.lower():
                try:
                    data = json.loads(script.string)
                    if 'available' in data:
                        return data['available']
                    # Sometimes nested in product object
                    if 'product' in data and 'available' in data['product']:
                        return data['product']['available']
                except:
                    continue
        
        # Method 2: Look for Shopify product object in inline scripts
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                # Look for patterns like: "available":true or 'available':true
                match = re.search(r'"available"\s*:\s*(true|false)', script.string, re.IGNORECASE)
                if match:
                    return match.group(1).lower() == 'true'
        
        # Method 3: Check meta tags
        availability_meta = soup.find('meta', {'property': 'product:availability'})
        if availability_meta:
            content = availability_meta.get('content', '').lower()
            return 'in stock' in content or 'instock' in content
        
        # Default to in stock
        print(" Could not find 'available' field, defaulting to IN STOCK")
        return True
    
    def check_rallyshop_stock(self, soup: BeautifulSoup) -> bool:
        """
        Check if a Rally Shop product is in stock.
        Looks for Shopify product JSON data with 'available' boolean.
        """
        import json
        import re
        
        # Method 1: Look for product JSON in script tags 
        scripts = soup.find_all('script', type='application/json')
        for script in scripts:
            if script.string and 'product' in script.string.lower():
                try:
                    data = json.loads(script.string)
                    if 'available' in data:
                        return data['available']
                    # Sometimes nested in product object
                    if 'product' in data and 'available' in data['product']:
                        return data['product']['available']
                except:
                    continue
        
        # Method 2: Look for Shopify product object in inline scripts
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                # Look for patterns like: "available":true or 'available':true
                match = re.search(r'"available"\s*:\s*(true|false)', script.string, re.IGNORECASE)
                if match:
                    return match.group(1).lower() == 'true'
        
        # Method 3: Check meta tags
        availability_meta = soup.find('meta', {'property': 'product:availability'})
        if availability_meta:
            content = availability_meta.get('content', '').lower()
            return 'in stock' in content or 'instock' in content
        
        # Default to in stock
        print("  Could not find 'available' field, defaulting to IN STOCK")
        return True
    
    def check_stock_status(self, url: str, retailer_name: str) -> Optional[bool]:
        """
        Check if a product is in stock at the given URL.
        Returns True if in stock, False if out of stock, None if error.
        """
        soup = self.fetch_page(url)
        if not soup:
            return None
        
        # Route to appropriate checker based on retailer
        retailer_lower = retailer_name.lower()
        
        if 'yumo' in retailer_lower:
            return self.check_yumo_stock(soup)
        elif 'joy' in retailer_lower or 'joybadminton' in retailer_lower:
            return self.check_joybadminton_stock(soup)
        elif 'rally' in retailer_lower or 'therallyshop' in retailer_lower:
            return self.check_rallyshop_stock(soup)
        else:
            print(f"  Unknown retailer: {retailer_name}")
            return None
    
    def get_all_racket_retailers(self) -> List[Dict]:
        """Fetch all racket-retailer combinations from database"""
        if not self.supabase:
            return []
        
        try:
            response = self.supabase.table('racket_retailer').select("""
                id,
                racket_id,
                retailer_id,
                product_url,
                in_stock,
                retailer (
                    name
                ),
                racket (
                    name
                )
            """).execute()
            
            return response.data
        except Exception as e:
            print(f" Error fetching racket_retailer data: {e}")
            return []
    
    def update_stock_status(self, entry_id: int, in_stock: bool) -> bool:
        """Update stock status for a racket_retailer entry"""
        if not self.supabase:
            return False
        
        try:
            self.supabase.table('racket_retailer').update({
                'in_stock': in_stock,
                'last_checked': datetime.now().isoformat()
            }).eq('id', entry_id).execute()
            
            return True
        except Exception as e:
            print(f"   Error updating entry {entry_id}: {e}")
            return False
    
    def run_stock_check(self):
        """Main stock checking routine"""
        print("=" * 70)
        print("STOCK AVAILABILITY CHECK")
        print("=" * 70)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Fetch all racket-retailer combinations
        print("1. Fetching racket-retailer entries...")
        entries = self.get_all_racket_retailers()
        
        if not entries:
            print("   No entries found or error occurred")
            return
        
        print(f"   Found {len(entries)} entries to check\n")
        
        # Track statistics
        stats = {
            'total': len(entries),
            'checked': 0,
            'in_stock': 0,
            'out_of_stock': 0,
            'status_changed': 0,
            'errors': 0,
            'newly_in_stock': [],  # For notifications
            'newly_out_of_stock': [],
        }
        
        # Check each entry
        print("2. Checking stock status...")
        print("-" * 70)
        
        for i, entry in enumerate(entries, 1):
            entry_id = entry['id']
            racket_name = entry['racket']['name']
            retailer_name = entry['retailer']['name']
            product_url = entry['product_url']
            previous_stock = entry.get('in_stock', True)
            
            print(f"\n[{i}/{len(entries)}] {racket_name[:40]}")
            print(f"  Retailer: {retailer_name}")
            
            # Check stock
            current_stock = self.check_stock_status(product_url, retailer_name)
            
            if current_stock is None:
                print(f"    Error checking stock")
                stats['errors'] += 1
                continue
            
            stats['checked'] += 1
            
            if current_stock:
                stats['in_stock'] += 1
                status_text = " IN STOCK"
            else:
                stats['out_of_stock'] += 1
                status_text = " OUT OF STOCK"
            
            print(f"  {status_text}")
            
            # Check if status changed
            if current_stock != previous_stock:
                stats['status_changed'] += 1
                
                if current_stock:
                    print(f"   CHANGE: Now IN STOCK (was out of stock)")
                    stats['newly_in_stock'].append({
                        'racket_id': entry['racket_id'],
                        'racket_name': racket_name,
                        'retailer_name': retailer_name,
                        'product_url': product_url,
                    })
                else:
                    print(f"   CHANGE: Now OUT OF STOCK (was in stock)")
                    stats['newly_out_of_stock'].append({
                        'racket_id': entry['racket_id'],
                        'racket_name': racket_name,
                        'retailer_name': retailer_name,
                    })
                
                # Update database
                if self.update_stock_status(entry_id, current_stock):
                    print(f"   Database updated")
                else:
                    print(f"  Failed to update database")
            else:
                # Update last_checked even if status didn't change
                self.update_stock_status(entry_id, current_stock)
        
        # Print summary
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Total entries:          {stats['total']}")
        print(f"Successfully checked:   {stats['checked']}")
        print(f"Errors:                 {stats['errors']}")
        print(f"Currently in stock:     {stats['in_stock']}")
        print(f"Currently out of stock: {stats['out_of_stock']}")
        print(f"Status changes:         {stats['status_changed']}")
        
        if stats['newly_in_stock']:
            print(f"\n {len(stats['newly_in_stock'])} items back in stock:")
            for item in stats['newly_in_stock'][:10]:
                print(f"   {item['racket_name'][:50]} at {item['retailer_name']}")
            if len(stats['newly_in_stock']) > 10:
                print(f"  ... and {len(stats['newly_in_stock']) - 10} more")
        
        if stats['newly_out_of_stock']:
            print(f"\n {len(stats['newly_out_of_stock'])} items now out of stock:")
            for item in stats['newly_out_of_stock'][:10]:
                print(f"   {item['racket_name'][:50]} at {item['retailer_name']}")
            if len(stats['newly_out_of_stock']) > 10:
                print(f"  ... and {len(stats['newly_out_of_stock']) - 10} more")
        
        print("\n" + "=" * 70)
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # Return stats for potential notification system
        return stats


def main():
    """Main execution"""
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    checker = StockChecker(supabase_url, supabase_key)
    checker.run_stock_check()


if __name__ == "__main__":
    main()