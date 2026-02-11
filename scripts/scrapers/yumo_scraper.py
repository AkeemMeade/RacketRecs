import requests
from bs4 import BeautifulSoup
import time
import json
import csv
from typing import List, Dict
from datetime import datetime

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
            time.sleep(self.delay) 
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def scrape_joybadminton_rackets(self) -> List[str]:
        """
        Scrape all badminton racket names from joybadminton.com
        Returns a list of dicts with `name` and `url`
        Deduplicates by base product URL to avoid color/variant duplicates
        """
        rackets = []
        seen_urls = set()  # Track unique base URLs
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
                href = link.get('href')
                if not href:
                    continue
                # Build absolute URL and normalize (remove query params like color variants)
                product_url = requests.compat.urljoin(base_url, href)
                #  remove trailing slash and query params to catch variants
                base_product_url = product_url.split('?')[0].rstrip('/')
                
                # Skip if we've already seen this product
                if base_product_url in seen_urls:
                    continue
                
                seen_urls.add(base_product_url)
                
                name = link.get_text(strip=True)
                if not name:
                    # fallback to title attribute or last path segment
                    name = link.get('title') or base_product_url.rstrip('/').split('/')[-1]

                entry = {'name': name, 'url': base_product_url}
                rackets.append(entry)
            
            print(f"Page {page}: Found {len(product_links)} links, {len(seen_urls)} unique products so far")
            page += 1
            
            # Safety check to avoid infinite loop
            if page > 20:
                break
        
        return rackets
    
    def scrape_product_details(self, product_url: str) -> Dict:
        """
        Scrape detailed information from a product page with robust spec extraction
        """
        import re
        soup = self.fetch_page(product_url)
        if not soup:
            return None
        details = {
            'url': product_url,
            'specifications': {},
            'description': ''
        }

        # Try common description containers
        desc_selectors = [
            '.product-single__description',
            '.product-description',
            '.description',
            '.rte',
            '#ProductInfo',
        ]

        description_text = ''
        for sel in desc_selectors:
            node = soup.select_one(sel)
            if node and node.get_text(strip=True):
                description_text = node.get_text('\n', strip=True)
                break

        # Fallback: use main content text
        if not description_text:
            main = soup.find('main') or soup.find('body')
            if main:
                description_text = main.get_text('\n', strip=True)

        details['description'] = description_text

        # 1) Look for specification tables
        spec_table = soup.find('table')
        if spec_table:
            rows = spec_table.find_all('tr')
            for row in rows:
                cols = row.find_all(['th', 'td'])
                if len(cols) >= 2:
                    key = cols[0].get_text(strip=True)
                    value = cols[1].get_text(strip=True)
                    if key and not key.lower() in ['pick up in-store', 'orders over']:
                        details['specifications'][key] = value

        # 2) Look for definition lists (dt/dd)
        if not details['specifications']:
            dts = soup.find_all('dt')
            for dt in dts:
                dd = dt.find_next_sibling('dd')
                if dd:
                    key = dt.get_text(strip=True)
                    value = dd.get_text(strip=True)
                    if key and not key.lower() in ['pick up in-store', 'orders over']:
                        details['specifications'][key] = value

        # 3) Parse description text to extract structured specs
        self._extract_specs_from_description(description_text, details['specifications'])

        return details
    
    def _extract_specs_from_description(self, desc_text: str, specs_dict: Dict):
        """
        Parse description text and extract structured specifications.
        Looks for patterns and common spec keywords.
        """
        import re
        if not desc_text:
            return
        
        lines = [l.strip() for l in desc_text.split('\n') if l.strip()]
        
        # Standard spec keywords to extract
        spec_keywords = {
            'model': ['model'],
            'color': ['color'],
            'weight': ['weight', 'grams', 'gram', 'lbs', '3u', '4u', '5u'],
            'balance': ['balance', 'head heavy', 'head light', 'even balance'],
            'shaft flexibility': ['shaft flexibility', 'flex', 'flexible', 'stiff', 'hard flex', 'medium'],
            'shaft thickness': ['shaft thickness', 'shaft mm'],
            'grip size': ['grip size'],
            'frame material': ['frame material', 'carbon', 'graphite'],
            'shaft material': ['shaft material'],
            'material': ['material', 'carbon fiber', 'graphite'],
            'player type': ['player type', 'attack', 'defense', 'precision', 'speed'],
            'player level': ['player level', 'beginner', 'intermediate', 'professional', 'professional'],
            'string tension': ['string tension', 'lbs', 'tension'],
            'overall length': ['overall length', 'length', '675mm'],
        }
        
        for line in lines:
            # Skip shipping and store pickup lines
            if any(skip in line.lower() for skip in ['pick up', 'shipping', 'standard shipping', 'orders over']):
                continue
            
            # Pattern 1: "Key: Value" format
            if ':' in line and len(line) < 150:
                parts = line.split(':', 1)
                key = parts[0].strip()
                value = parts[1].strip()
                
                # Check if key matches any spec keyword
                key_lower = key.lower()
                for spec_key, keywords in spec_keywords.items():
                    if any(kw in key_lower for kw in keywords) and value:
                        if spec_key not in specs_dict:
                            specs_dict[spec_key] = value
                        break
                
                # If no keyword match but key is short, it might be a spec label
                if len(key) < 30 and value and not any(skip in key.lower() for skip in ['made', 'product', 'technology']):
                    if key not in specs_dict:
                        specs_dict[key] = value
            
            # Pattern 2: "Weight: 3U (85-89g)" or similar
            m = re.search(r'weight\s*[:\-]?\s*([0-9]U|[0-9]+\s*g)', line, re.I)
            if m and 'weight' not in specs_dict:
                specs_dict['weight'] = m.group(1)
            
            # Pattern 3: "Balance: Head Heavy" or similar
            m = re.search(r'balance\s*[:\-]?\s*(head heavy|head light|even balance)', line, re.I)
            if m and 'balance' not in specs_dict:
                specs_dict['balance'] = m.group(1)
            
            # Pattern 4: "Flex: Flexible" or similar
            m = re.search(r'flex(?:ibility)?\s*[:\-]?\s*([a-z\s]+?)(?:\n|$)', line, re.I)
            if m and 'shaft flexibility' not in specs_dict:
                specs_dict['shaft flexibility'] = m.group(1).strip()
            
            # Pattern 5: Grip size like "G5", "G6"
            m = re.search(r'grip\s+size\s*[:\-]?\s*(g[0-9])', line, re.I)
            if m and 'grip size' not in specs_dict:
                specs_dict['grip size'] = m.group(1).upper()
    
    def normalize_specifications(self, data: List[Dict]) -> List[Dict]:
        """
        Normalize all specifications to consistent field names.
        Standardizes common variations and fills gaps from descriptions.
        """
        import re
        
        # Define standard spec field names and their aliases
        field_aliases = {
            'Model': ['Model', 'model', 'product model'],
            'Color': ['Color', 'color'],
            'Weight': ['Weight', 'weight', 'Weight Class'],
            'Balance': ['Balance', 'balance'],
            'Shaft Flexibility': ['Shaft Flexibility', 'shaft flexibility', 'Flex', 'flex', 'Flexibility'],
            'Shaft Thickness': ['Shaft Thickness', 'shaft thickness', 'Shaft Mm', 'shaft mm'],
            'Grip Size': ['Grip Size', 'grip size', 'Racket Grip Size'],
            'Frame Material': ['Frame Material', 'frame material'],
            'Shaft Material': ['Shaft Material', 'shaft material'],
            'Material': ['Material', 'material'],
            'Player Type': ['Player Type', 'player type'],
            'Player Level': ['Player Level', 'player level'],
            'String Tension': ['String Tension', 'string tension', 'Maximum Racket Tension', 'Stringing Tension'],
            'Overall Length': ['Overall Length', 'overall length', 'Length'],
            'Frame Shape': ['Frame Shape', 'frame shape'],
            'Product Range': ['Product Range', 'product range'],
        }
        
        for item in data:
            if 'specifications' not in item:
                item['specifications'] = {}
            
            specs = item['specifications']
            normalized = {}
            
            # First pass: consolidate existing specs under standard names
            for standard_name, aliases in field_aliases.items():
                for spec_key, spec_value in specs.items():
                    if spec_key in aliases:
                        if standard_name not in normalized:
                            normalized[standard_name] = spec_value
                        break
            
            # Second pass: look for unmapped specs
            for spec_key, spec_value in specs.items():
                is_mapped = False
                for standard_name, aliases in field_aliases.items():
                    if spec_key in aliases:
                        is_mapped = True
                        break
                if not is_mapped and spec_value:
                    # Try to assign unmapped specs intelligently
                    key_lower = spec_key.lower()
                    if 'balance' in key_lower:
                        normalized['Balance'] = spec_value
                    elif 'weight' in key_lower or 'gram' in key_lower:
                        normalized['Weight'] = spec_value
                    elif 'color' in key_lower:
                        normalized['Color'] = spec_value
                    elif any(x in key_lower for x in ['flex', 'stiff']):
                        normalized['Shaft Flexibility'] = spec_value
                    elif 'material' in key_lower:
                        if 'frame' in key_lower:
                            normalized['Frame Material'] = spec_value
                        elif 'shaft' in key_lower:
                            normalized['Shaft Material'] = spec_value
                        else:
                            normalized['Material'] = spec_value
                    elif 'grip' in key_lower:
                        normalized['Grip Size'] = spec_value
                    elif 'player' in key_lower:
                        if 'level' in key_lower:
                            normalized['Player Level'] = spec_value
                        elif 'type' in key_lower:
                            normalized['Player Type'] = spec_value
            
            # Third pass: extract missing key specs from description if available
            if 'description' in item and item['description']:
                desc = item['description']
                
                # Extract Balance if missing
                if 'Balance' not in normalized:
                    m = re.search(r'Balance\s*[:\-]?\s*([^\n]+)', desc, re.I)
                    if m:
                        normalized['Balance'] = m.group(1).strip()
                
                # Extract Weight if missing
                if 'Weight' not in normalized:
                    m = re.search(r'Weight\s*[:\-]?\s*([^\n]+)', desc, re.I)
                    if m:
                        normalized['Weight'] = m.group(1).strip()
                
                # Extract Flex if missing
                if 'Shaft Flexibility' not in normalized:
                    m = re.search(r'(?:Shaft\s+)?Flexibility\s*[:\-]?\s*([^\n]+)', desc, re.I)
                    if m:
                        normalized['Shaft Flexibility'] = m.group(1).strip()
                
                # Extract Color if missing
                if 'Color' not in normalized:
                    m = re.search(r'Color\s*[:\-]?\s*([^\n]+)', desc, re.I)
                    if m:
                        normalized['Color'] = m.group(1).strip()
            
            item['specifications'] = normalized
        
        return data
    
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
        # Ensure nested dicts are serialized for CSV
        rows = []
        for item in data:
            row = {}
            for k, v in item.items():
                if isinstance(v, (dict, list)):
                    row[k] = json.dumps(v, ensure_ascii=False)
                else:
                    row[k] = v
            rows.append(row)

        keys = rows[0].keys()
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(rows)
        print(f"Saved {len(rows)} items to {filename}")



if __name__ == "__main__":
    scraper = BadmintonRacketScraper()
    
    print("Yumopro Racket Scraper")
    print("=" * 50)
    
    print("Scraping all badminton racket entries from Yumo.com...")
    racket_entries = scraper.scrape_joybadminton_rackets()

    print(f"\nFound {len(racket_entries)} unique racket entries:")
    print("=" * 50)

    for i, entry in enumerate(racket_entries, 1):
        print(f"{i:3d}. {entry.get('name')} -> {entry.get('url')}")

    # Save simple list of names
    with open('yumo_racket_names.txt', 'w', encoding='utf-8') as f:
        for entry in racket_entries:
            f.write(entry.get('name', '') + '\n')
    print(f"\nSaved names to yumo_racket_names.txt")

    # Now fetch each product page and extract detailed specs
    detailed = []
    for entry in racket_entries:
        url = entry.get('url')
        name = entry.get('name')
        details = scraper.scrape_product_details(url)
        if details:
            details['name'] = name
            detailed.append(details)

    # Normalize and standardize all specifications
    print(f"\nNormalizing specifications for {len(detailed)} rackets...")
    detailed = scraper.normalize_specifications(detailed)

    # Save detailed results
    scraper.save_to_json(detailed, 'yumo_rackets_detailed.json')
    scraper.save_to_csv(detailed, 'yumo_rackets_detailed.csv')
    
    print(f"\nDone! Scraped {len(detailed)} unique rackets with standardized specs.")