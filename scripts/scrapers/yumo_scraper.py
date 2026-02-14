import requests
from bs4 import BeautifulSoup
import time
import json
import csv
import os
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
            time.sleep(self.delay)  # Be polite
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
                # Normalize: remove trailing slash and query params to catch variants
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
            'description': '',
            'price': None,
            'image_url': None,
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

        # Extract price (try meta tags and common price containers)
        price_text = ''
        price_meta = soup.find('meta', attrs={'property': 'product:price:amount'}) or soup.find('meta', attrs={'itemprop': 'price'})
        if price_meta and price_meta.get('content'):
            price_text = price_meta.get('content')
        else:
            price_node = soup.find(attrs={'class': lambda x: x and 'price' in x.lower()}) or soup.find(id=lambda x: x and 'price' in x.lower())
            if price_node:
                price_text = price_node.get_text(' ', strip=True)

        if price_text:
            m = re.search(r'([0-9]+(?:[\.,][0-9]{2})?)', price_text.replace(',', ''))
            if m:
                cad_price = float(m.group(1).replace(',', ''))
                usd_price = round(cad_price * 0.75, 2)  #  conversion rate
                details['price'] = usd_price

        # Extract main product image URL
        image_url = None
        # Try Open Graph image
        og_img = soup.find('meta', property='og:image')
        if og_img and og_img.get('content'):
            image_url = og_img['content']
        # Fallback: look for main product image in img tags
        if not image_url:
            img_tag = soup.find('img', attrs={'src': re.compile(r'cdn.*(product|racket|badminton).*', re.I)})
            if img_tag and img_tag.get('src'):
                image_url = img_tag['src']
        # Fallback: first large image
        if not image_url:
            imgs = soup.find_all('img')
            for img in imgs:
                src = img.get('src')
                if src and ('racket' in src or 'product' in src or 'badminton' in src):
                    image_url = src
                    break
        details['image_url'] = image_url

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

        # If price still missing, try description
        if not details.get('price') and description_text:
            m = re.search(r'\$\s*([0-9]+(?:[\.,][0-9]{2})?)', description_text)
            if m:
                cad_price = float(m.group(1).replace(',', ''))
                usd_price = round(cad_price * 0.75, 2)  #  conversion rate
                details['price'] = usd_price

        #    IMPROVED STRING TENSION EXTRACTION 
        # Try to extract string tension from specs or description if missing
        tension_keys = [k for k in details['specifications'] if 'tension' in k.lower()]
        if not tension_keys:
            # Try to extract from description
            tension_match = re.search(r'(string\s*tension|max(?:imum)?\s*tension|tension\s*lbs?)\s*[:\-]?\s*([\d≦≤]+\s*(?:lbs|kg)?(?:\s*\([^)]+\))?)', description_text, re.I)
            if tension_match:
                details['specifications']['String Tension'] = tension_match.group(2).strip()
            else:
                # Try to find a line with tension info
                for line in description_text.split('\n'):
                    if 'tension' in line.lower() and any(x in line for x in ['lbs', 'kg']):
                        details['specifications']['String Tension'] = line.strip()
                        break

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
            'material': ['material', 'carbon fiber', 'graphite'],
            'string tension': ['string tension', 'lbs', 'tension'],
            'price': ['price', '$'],
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
            m = re.search(r'flex(?:ibility)?\s*[:\-]?\s*(Flexible|Stiff|Medium|Hard Flex)', line, re.I)
            if m and 'shaft flexibility' not in specs_dict:
                specs_dict['shaft flexibility'] = m.group(1).strip()
            
            # Pattern 5: Grip size like "G5", "G6"
            m = re.search(r'grip\s+size\s*[:\-]?\s*(g[0-9])', line, re.I)
            if m and 'grip size' not in specs_dict:
                specs_dict['grip size'] = m.group(1).upper()

            # Price like "$199.99"
            m = re.search(r'\$\s*([0-9]+(?:[\.,][0-9]{2})?)', line)
            if m and 'price' not in specs_dict:
                specs_dict['price'] = m.group(1).replace(',', '')

            # availability parsing removed; only price is kept
    
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
            'Material': ['Material', 'material'],
            'String Tension': ['String Tension', 'string tension', 'Maximum Racket Tension', 'Stringing Tension'],
            'Product Range': ['Product Range', 'product range'],
            'Price': ['Price', 'price'],
        }
        
        for item in data:
            if 'specifications' not in item:
                item['specifications'] = {}
            
            specs = item['specifications']
            normalized = {}
            
            # First pass: Search existing specs under standard names
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
                        normalized['Material'] = spec_value
                    elif 'price' in key_lower or key_lower.strip().startswith('$'):
                        normalized['Price'] = str(spec_value).replace('$', '').strip()
                    # availability normalization removed
            
            # Third pass: extract missing key specs from description if available
            if 'description' in item and item['description']:
                desc = item['description']
                
                # Extract Balance if missing - only capture known balance types
                if 'Balance' not in normalized:
                    m = re.search(r'Balance\s*[:\-]?\s*(Head Heavy|Head Light|Even Balance)', desc, re.I)
                    if m:
                        normalized['Balance'] = m.group(1).strip()
                
                # Extract Weight if missing - capture weight class (3U, 4U, 5U, or grams)
                if 'Weight' not in normalized:
                    m = re.search(r'Weight\s*[:\-]?\s*([3-5]U|[0-9]+\s*(?:grams?|g)\b)', desc, re.I)
                    if m:
                        normalized['Weight'] = m.group(1).strip()
                
                # Extract Flex if missing - only capture known flex types
                if 'Shaft Flexibility' not in normalized:
                    m = re.search(r'(?:Shaft\s+)?Flexibility\s*[:\-]?\s*(Flexible|Stiff|Medium|Hard Flex)', desc, re.I)
                    if m:
                        normalized['Shaft Flexibility'] = m.group(1).strip()
                
                # Extract Color if missing
                if 'Color' not in normalized:
                    m = re.search(r'Color\s*[:\-]?\s*([^\n]+?)(?:\n|Product|$)', desc, re.I)
                    if m:
                        normalized['Color'] = m.group(1).strip()
                
                # Extract Maximum Racket Tension if missing
                if 'Maximum Racket Tension' not in normalized:
                    m = re.search(r'Maximum Racket Tension\s*[:\-]?\s*([^\n]+?)(?:\n|Product|$|Made)', desc, re.I)
                    if m:
                        normalized['Maximum Racket Tension'] = m.group(1).strip()
            
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


def import_to_database(rackets: List[Dict]):
    """
    Import scraped rackets to the database via the Next.js API endpoint.
    Requires the Next.js dev server to be running at http://localhost:3000
    """
    import requests
    
    api_url = "http://localhost:3000/api/rackets/import"
    
    try:
        print(f"Sending {len(rackets)} rackets to API...")
        response = requests.post(api_url, json=rackets, timeout=30)
        
        try:
            result = response.json()
        except:
            print(f"Failed to parse response: {response.text}")
            return
        
        if response.status_code == 201:
            if result.get("success"):
                print(f"✓ Database import successful: {result.get('message')}")
            else:
                print(f"✗ Database import failed: {result.get('error')}")
                if result.get('details'):
                    print(f"  Details: {result.get('details')}")
                if result.get('hint'):
                    print(f"  Hint: {result.get('hint')}")
        else:
            print(f"✗ API returned status {response.status_code}")
            print(f"  Error: {result.get('error', 'Unknown error')}")
            if result.get('details'):
                print(f"  Details: {result.get('details')}")
            if result.get('hint'):
                print(f"  Hint: {result.get('hint')}")
                
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to API endpoint at http://localhost:3000")
        print("  Make sure your Next.js dev server is running: npm run dev")
    except Exception as e:
        print(f"✗ Error importing to database: {e}")


# Example usage
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

    # Create gathering directory if it doesn't exist
    gathering_dir = 'scripts/gathering'
    if not os.path.isdir(gathering_dir):
        os.makedirs(gathering_dir)

    # Save detailed results to gathering folder
    scraper.save_to_json(detailed, os.path.join(gathering_dir, 'yumo_rackets_detailed.json'))
    scraper.save_to_csv(detailed, os.path.join(gathering_dir, 'yumo_rackets_detailed.csv'))
    
    print(f"\nDone! Scraped {len(detailed)} unique rackets with standardized specs.")
    
    #  Import to database via API endpoint
    print("\nImporting to database...")
    try:
        import_to_database(detailed)
    except Exception as e:
        print(f"Warning: Failed to import to database: {e}")
        print("You can manually import by making a POST request to /api/rackets/import")