"""
Badminton Racket Scraper - Basic Template
Uses requests + BeautifulSoup for simple web scraping
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import csv
from typing import List, Dict
from datetime import datetime
import os

class BadmintonRacketScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.delay = 2  # seconds between requests
        
    def fetch_page(self, url: str) -> BeautifulSoup:
        """Fetch a page and return BeautifulSoup object"""
        try:
            print(f"Fetching: {url}")
            response = self.session.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            time.sleep(self.delay)  # Be polite
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def scrape_yumo_rackets(self) -> List[str]:
        """
        Scrape all badminton racket names from yumo.ca
        Returns a list of racket names
        """
        rackets = []
        base_url = "https://yumo.ca/collections/badminton-rackets"
        page = 1
        
        while True:
            if page == 1:
                url = base_url
            else:
                url = f"{base_url}?page={page}"
            
            soup = self.fetch_page(url)
            if not soup:
                break
            
            # Find all product links
            product_links = soup.find_all('a', href=lambda x: x and '/products/' in x)
            
            if not product_links:
                break
            
            for link in product_links:
                name = link.get_text(strip=True)
                if name and name not in rackets:  # Avoid duplicates
                    rackets.append(name)
            
            print(f"Page {page}: Found {len(product_links)} products")
            page += 1
            
            # Safety check to avoid infinite loop
            if page > 20:
                break
        
        return rackets
    
    def scrape_product_details(self, product_url: str) -> Dict:
        """
        Scrape detailed information from a product page
        """
        soup = self.fetch_page(product_url)
        if not soup:
            return None
        
        details = {
            'url': product_url,
            'specifications': {},
            'description': ''
        }
        # Extract product name
        return details
    
    def extract_brand(self, product_element) -> str:
        """Extract brand from product element or name"""
        brands = ['Yonex', 'Victor', 'Li-Ning', 'Lining', 'Hundred']
        # Try to find brand in the product text
        text = product_element.text.lower()
        for brand in brands:
            if brand.lower() in text:
                return brand
        return 'Unknown'
    
    def parse_weight(self, weight_str: str) -> str:
        """Parse weight notation (3U, 4U, etc.)"""
        weight_map = {
            '3U': '85-89g',
            '4U': '80-84g'
        }
        for key in weight_map:
            if key in weight_str.upper():
                return key
        return weight_str
    
    def save_to_json(self, data: List[Dict], filename: str):
        """Save scraped data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(data)} items to {filename}")
    
    def save_to_csv(self, data: List[Dict], filename: str):
        """Save scraped data to CSV file"""
        if not data:
            print("No data to save")
            return
        
        keys = data[0].keys()
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(data)
        print(f"Saved {len(data)} items to {filename}")


# Example usage
if __name__ == "__main__":
    scraper = BadmintonRacketScraper()
    
    print("Yumopro Racket Scraper")
    print("=" * 50)
    
    print("Scraping all badminton racket names from Yumo.com...")
    racket_names = scraper.scrape_yumo_rackets()
    
    print(f"\nFound {len(racket_names)} unique racket names:")
    print("=" * 50)
    
    for i, name in enumerate(racket_names, 1):
        print(f"{i:3d}. {name}")
    
    # Save to file
    if not os.path.isdir('scripts/gathering'):
        os.makedirs('scripts/gathering')

    with open('scripts/gathering/yumo_racket_names.txt', 'w', encoding='utf-8') as f:
        for name in racket_names:
            f.write(name + '\n')
    print(f"\nSaved names to scripts/gathering/yumo_racket_names.txt")