#!/usr/bin/env python3
"""
JoyBadminton String Scraper

Scrapes strings from JoyBadminton.com focusing on:
- Yonex
- Victor
- Gosen

Extracts: name, manufacturer, gauge, feel, image, product URL

Usage:
    python scripts/joy_string_scraper.py
"""

import os
import re
import time
from pathlib import Path
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Load environment
# File is in scripts/scrapers/, so go up 3 levels: scrapers -> scripts -> project root
env_path = Path(__file__).resolve().parent.parent.parent / '.env.local'
load_dotenv(env_path)

class JoyStringsScraper:
    def __init__(self):
        """Initialize scraper"""
        self.base_url = "https://joybadminton.com"
        self.strings_url = "https://joybadminton.com/collections/all-string"
        
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Target manufacturers
        self.target_brands = ['yonex', 'victor', 'gosen']
        
        # Initialize Supabase
        self.supabase = None
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not supabase_url:
            print("  NEXT_PUBLIC_SUPABASE_URL not found in environment")
        if not supabase_key:
            print("  NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment")
        
        if supabase_url and supabase_key:
            try:
                from supabase import create_client
                self.supabase = create_client(supabase_url, supabase_key)
                print(" Supabase connection initialized")
            except Exception as e:
                print(f" Could not connect to Supabase: {e}")
        
        # Load manufacturers
        self.manufacturers = {}
        self._load_manufacturers()
    
    def _load_manufacturers(self):
        """Load manufacturer mapping from database"""
        if not self.supabase:
            return
        
        try:
            response = self.supabase.table('manufacturer').select('*').execute()
            for mfr in response.data:
                self.manufacturers[mfr['name'].lower()] = mfr['manufacturer_id']
            print(f" Loaded {len(self.manufacturers)} manufacturers")
        except Exception as e:
            print(f"  Could not load manufacturers: {e}")
    
    def get_manufacturer_id(self, brand_name: str) -> int:
        """Get manufacturer ID from name"""
        brand_lower = brand_name.lower()
        return self.manufacturers.get(brand_lower)
    
    def extract_gauge(self, text: str) -> str:
        """Extract gauge/size from text"""
        # Look for patterns like "0.66mm", "0.63mm x 10m", "Gauge: 0.70mm"
        gauge_pattern = r'(\d+\.\d+)\s*mm'
        match = re.search(gauge_pattern, text, re.IGNORECASE)
        if match:
            return f"{match.group(1)}mm"
        return None
    
    def extract_feel(self, description: str) -> str:
        """Extract feel/characteristics from description"""
        feel_indicators = []
        
        # Look for key properties section
        if 'key properties:' in description.lower():
            # Extract everything after "Key Properties:"
            parts = description.lower().split('key properties:')
            if len(parts) > 1:
                feel_text = parts[1].strip()
                # Take first line or until next bullet
                feel_text = feel_text.split('\n')[0].strip()
                if feel_text:
                    return feel_text.title()
        
        # Look for Feel: pattern (Victor style)
        feel_match = re.search(r'Feel:\s*([^\n\*]+)', description, re.IGNORECASE)
        if feel_match:
            feel_indicators.append(f"Feel: {feel_match.group(1).strip()}")
        
        # Look for Feature: pattern (Victor style)
        feature_match = re.search(r'Feature:\s*([^\n\*]+)', description, re.IGNORECASE)
        if feature_match:
            feel_indicators.append(f"Feature: {feature_match.group(1).strip()}")
        
        # Look for rating patterns (Hundred style)
        ratings = []
        for line in description.split('\n'):
            if '/' in line and any(word in line.lower() for word in ['control', 'durability', 'repulsion', 'power', 'absorption']):
                ratings.append(line.strip())
        
        if ratings:
            return ', '.join(ratings[:3])  # Top 3 ratings
        
        if feel_indicators:
            return ', '.join(feel_indicators)
        
        return None
    
    def scrape_strings_list(self):
        """Scrape list of strings from collection page"""
        print(f"\nScraping: {self.strings_url}")
        
        try:
            response = requests.get(self.strings_url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            strings = []
            seen_urls = set()  # Avoid duplicates
            
            # Find all links to products
            product_links = soup.find_all('a', href=lambda h: h and '/products/' in h)
            
            print(f"  Found {len(product_links)} product links")
            
            for link in product_links:
                try:
                    # Get product URL
                    href = link.get('href', '')
                    
                    # Skip services (stringing, grommet replacement)
                    if 'service' in href.lower():
                        continue
                    
                    # Build full URL
                    if href.startswith('http'):
                        product_url = href
                    elif href.startswith('/'):
                        product_url = self.base_url + href
                    else:
                        product_url = self.base_url + '/' + href
                    
                    # Remove query params and fragments
                    product_url = product_url.split('?')[0].split('#')[0]
                    
                    # Skip duplicates
                    if product_url in seen_urls:
                        continue
                    seen_urls.add(product_url)
                    
                    # Get product name from link text OR from URL
                    name = link.text.strip()
                    
                    # If link text is empty or just "Sold Out", extract from URL
                    if not name or name.lower() in ['sold out', '']:
                        # Extract from URL: /products/yonex-bg66-ultimax -> Yonex BG66 Ultimax
                        url_parts = product_url.split('/products/')
                        if len(url_parts) > 1:
                            name = url_parts[1].replace('-', ' ').title()
                        else:
                            continue
                    
                    # Skip if still no name
                    if not name:
                        continue
                    
                    strings.append({
                        'name': name,
                        'product_url': product_url,
                    })
                
                except Exception as e:
                    print(f"    Error parsing product link: {e}")
                    continue
            
            print(f" Found {len(strings)} strings to process")
            return strings
        
        except Exception as e:
            print(f" Error scraping strings list: {e}")
            return []
    
    def scrape_string_details(self, product_url: str):
        """Scrape detailed info from product page"""
        try:
            response = requests.get(product_url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find description - try multiple selectors
            description = None
            
            # Try different description selectors
            selectors = [
                ('div', 'product__description'),
                ('div', 'product-description'),
                ('div', 'description'),
            ]
            
            for tag, class_name in selectors:
                description_elem = soup.find(tag, class_=class_name)
                if description_elem:
                    description = description_elem.get_text(separator='\n').strip()
                    break
            
            # If still no description, try finding any div with product info
            if not description:
                # Look for any text on the page (fallback)
                body = soup.find('body')
                if body:
                    description = body.get_text(separator='\n')
            
            print(f"    Description length: {len(description) if description else 0} chars")
            if description:
                print(f"    First 200 chars: {description[:200]}...")
            
            # Extract gauge
            gauge = self.extract_gauge(description) if description else None
            
            # Extract feel
            feel = self.extract_feel(description) if description else None
            
            time.sleep(1) 
            
            return {
                'gauge': gauge,
                'feel': feel,
                'description': description[:500] if description else None,  # First 500 chars
            }
        
        except Exception as e:
            print(f"    Error fetching details: {e}")
            return {'gauge': None, 'feel': None, 'description': None}
    
    def determine_manufacturer(self, name: str) -> int:
        """Determine manufacturer from string name"""
        name_lower = name.lower()
        
        # Hardcoded manufacturer IDs for main brands
        if 'yonex' in name_lower:
            return 6
        elif 'victor' in name_lower:
            return 9
        elif 'gosen' in name_lower:
            return 21
        
        # Try to match other manufacturers from database
        for brand in self.target_brands:
            if brand in name_lower:
                return self.get_manufacturer_id(brand)
        
        #  skip strings without known manufacturer
        return None
    
    def add_string_to_db(self, string_data: dict) -> bool:
        """Add string to database"""
        if not self.supabase:
            print(f"   No Supabase connection")
            return False
        
        try:
            
            print(f"  Attempting insert: manufacturer_id={string_data['manufacturer_id']}, gauge={string_data.get('gauge')}, feel={string_data.get('feel')}")
            
            self.supabase.table('string').insert({
                'name': string_data['name'],
                'manufacturer_id': string_data['manufacturer_id'],
                'gauge': string_data.get('gauge'),
                'feel': string_data.get('feel'),
                'description': string_data.get('description'),
            }).execute()
            
            return True
        except Exception as e:
            print(f"   Error inserting string: {e}")
            return False
    
    def run(self):
        """Main scraping routine"""
        print("=" * 70)
        print("JOYBADMINTON STRING SCRAPER")
        print("=" * 70)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Scrape list
        strings = self.scrape_strings_list()
        
        if not strings:
            print("\n No strings found")
            return
        
        # Process each string
        print(f"\nProcessing {len(strings)} strings...")
        print("-" * 70)
        
        stats = {'success': 0, 'failed': 0, 'skipped': 0}
        
        for i, string in enumerate(strings, 1):
            print(f"\n[{i}/{len(strings)}] {string['name']}")
            
            # Determine manufacturer
            manufacturer_id = self.determine_manufacturer(string['name'])
            if not manufacturer_id:
                print("    Could not determine manufacturer, skipping")
                stats['skipped'] += 1
                continue
            
            # Get detailed info
            print("  Fetching details...")
            details = self.scrape_string_details(string['product_url'])
            
            # Combine data
            string_data = {
                'name': string['name'],
                'manufacturer_id': manufacturer_id,
                'gauge': details['gauge'],
                'feel': details['feel'],
                'description': details['description'],
            }
            
            print(f"  Gauge: {string_data['gauge'] or 'N/A'}")
            print(f"  Feel: {string_data['feel'][:50] if string_data['feel'] else 'N/A'}...")
            
            # Add to database
            if self.add_string_to_db(string_data):
                print("   Added to database")
                stats['success'] += 1
            else:
                print("   Failed to add to database")
                stats['failed'] += 1
        
        # Summary
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Total processed:  {len(strings)}")
        print(f"Successfully added: {stats['success']}")
        print(f"Failed:           {stats['failed']}")
        print(f"Skipped:          {stats['skipped']}")
        print("=" * 70)
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)


def main():
    scraper = JoyStringsScraper()
    scraper.run()


if __name__ == "__main__":
    main()