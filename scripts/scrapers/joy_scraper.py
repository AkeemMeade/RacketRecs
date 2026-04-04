import requests
from bs4 import BeautifulSoup
import time
import json
import csv
import os
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import re
from difflib import SequenceMatcher
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.local in the project root
load_dotenv(Path(__file__).resolve().parents[2] / '.env.local')

# Known badminton brands and series for component extraction
KNOWN_BRANDS = {
    'yonex': 'Yonex',
    'victor': 'Victor',
    'li-ning': 'Li-Ning',
    'lining': 'Li-Ning',
    'hundred': 'Hundred',
    'ashaway': 'Ashaway',
    'apacs': 'APACS',
    'mizuno': 'Mizuno',
    'maligao': 'Maligao',
    'senston': 'Senston',
}

KNOWN_SERIES = {
    # Yonex
    'astrox': 'Astrox',
    'nanoray': 'Nanoray',
    'voltric': 'Voltric',
    'arcsaber': 'Arcsaber',
    'duora': 'Duora',
    'zf': 'ZF',
    'nf': 'NF',
    'wcb': 'WCB',
    'muscle': 'Muscle',
    'isometric': 'Isometric',
    'nanoflare': 'Nanoflare',
    # Victor
    'auraspeed': 'Auraspeed',
    'hypernano': 'HyperNano',
    'jetspeed': 'Jetspeed',
    'mcius': 'MCIUS',
    'tk': 'TK',
    'brave': 'Brave',
    'power': 'Power',
    'thruster': 'Thruster',
    'challenger': 'Challenger',
    'brave sword': 'Brave Sword',
    'driveX': 'DriveX',
    # Li-Ning
    'axforce': 'Axforce',
    'windstorm': 'Windstorm',
    'turbo': 'Turbo',
    'tectonic': 'Tectonic',
    'burn': 'Burn',
    'astrastar': 'AstraStar',
    'bladex': 'Bladex',
    'conquer': 'Conquer',
    'halbertec': 'Halbertec',
    # Hundred
    'falcon': 'Falcon',
    'phantom': 'Phantom',
    'carbon': 'Carbon',
    'nitrix': 'Nitrix',
    'hyfonic': 'Hyfonic',
    'nuclear': 'Nuclear',
    'flareon': 'Flareon',
    'battle': 'Battle',
    't-fusion': 'T-Fusion',
    'nano-neo': 'Nano-Neo',
    'nano neo': 'Nano Neo',
    'super storm': 'Super Storm',
    'atomic': 'Atomic',
    'z tronic': 'Z Tronic',
    'z-tronic': 'Z Tronic',
    'ioniq': 'Ioniq',
    'primearmour': 'Primearmour',
    'superlite': 'Superlite',
}

# Words to ignore when normalizing model names (colors, weights, etc.)
IGNORE_WORDS = {
    # Generic terms
    'unstrung', 'strung', 'badminton', 'racket', 'racquet', 'racquette',
    'edition', 'version', 'model', 'original', 'classic', 'limited', 
    'special', 'authentic', 'official', 'store',
    'racketbadminton', 'badmintonracket',
    'preorder', 'pre', 'order',
    
    # Standard colors (comprehensive but not product names)
    'red', 'blue', 'green', 'yellow', 'white', 'black', 'gray', 'grey', 
    'purple', 'pink', 'orange', 'silver', 'gold', 'cyan', 'magenta', 
    'maroon', 'navy', 'teal', 'lime', 'bronze', 'beige', 'brown', 'violet',
    
    # Color descriptors
    'jungle', 'camo', 'camouflage', 'dark', 'light', 'bright',
}

def normalize_racket_name_for_fuzzy_match(name: str) -> str:
    """
    Normalize a racket name by removing noise and standardizing format.
    This creates a canonical form that's consistent across different naming styles.
    """
    name_lower = name.lower()
    
    # Remove common noise patterns
    noise_patterns = [
        r'\b(unstrung|strung)\b',
        r'\b(badminton|racket|racquet)\b',
        r'\b(store|official|authentic)\b',
        r'\b(x)\b',  # "Victor x Baby Milo" → "Victor Baby Milo"
        r'\b(edition|version|model)\b',
        r'\([^)]+\)',  # Remove parentheses content
        # Weight/grip codes
        r'\b\d*u\d*\b',
        r'\bug\d+\b',
        r'\bg\d+\b',
        r'\b\d+ug\d+\b',
        # Colors (comprehensive list)
        r'\b(red|blue|green|yellow|white|black|gray|grey|purple|pink|orange)\b',
        r'\b(silver|gold|cyan|magenta|maroon|navy|teal|lime|bronze)\b',
        r'\b(jungle|camo|camouflage|dark|light|bright)\b',
    ]
    
    cleaned = name_lower
    for pattern in noise_patterns:
        cleaned = re.sub(pattern, ' ', cleaned)
    
    # Normalize separators: convert all dashes/underscores to spaces
    cleaned = re.sub(r'[-_]+', ' ', cleaned)
    
    # Remove multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned   

def extract_key_identifiers(name: str) -> List[str]:
    """
    Extract meaningful tokens (brand, series, model numbers).
    Filters out filler words and keeps only identifying information.
    """
    name_clean = normalize_racket_name_for_fuzzy_match(name)
    
    tokens = name_clean.split()
    
    # Keep only meaningful tokens
    key_tokens = []
    for token in tokens:
        # Keep numbers (model identifiers like 88, 100, 700)
        if re.match(r'^\d+$', token):
            key_tokens.append(token)
        # Keep alphanumeric combos (88d, 100ii, 90k)
        elif re.match(r'^\d+[a-z]+$', token, re.I):
            key_tokens.append(token)
        # Keep words longer than 2 chars
        elif len(token) > 2:
            key_tokens.append(token)
        # Keep known short codes
        elif token in ['tk', 'zf', 'nf', 'ii', 'iii', 'd', 'k']:
            key_tokens.append(token)
    
    return key_tokens 

def fuzzy_match_score(name1: str, name2: str) -> float:
    """
    Calculate match score between two racket names.
    Combines string similarity with token overlap.
    Returns 0.0 to 1.0 (higher = better match).
    """
    # Normalize both names
    norm1 = normalize_racket_name_for_fuzzy_match(name1)
    norm2 = normalize_racket_name_for_fuzzy_match(name2)
    
    # String similarity (handles typos, word order changes)
    base_score = SequenceMatcher(None, norm1, norm2).ratio()
    
    # Token overlap (ensures key identifiers match)
    tokens1 = set(extract_key_identifiers(name1))
    tokens2 = set(extract_key_identifiers(name2))
    
    if tokens1 and tokens2:
        intersection = tokens1 & tokens2
        union = tokens1 | tokens2
        token_score = len(intersection) / len(union)
    else:
        token_score = 0.0
    
    # Weighted combination
    # 60% string similarity + 40% token overlap
    final_score = (base_score * 0.6) + (token_score * 0.4)
    
    return final_score

class JoyBadmintonScraper:
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize scraper with optional Supabase connection"""
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.delay = 2  # seconds between requests
        
        # Initialize Supabase client
        self.supabase = None
        url = supabase_url or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = supabase_key or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if url and key:
            try:
                from supabase import create_client
                self.supabase = create_client(url, key)
                print("Supabase connection initialized")
            except ImportError:
                print("supabase-py not installed. Install with: pip install supabase")
            except Exception as e:
                print(f"Could not connect to Supabase: {e}")
        else:
            print("Supabase credentials not provided")
        
        # Cache manufacturers
        self.manufacturers = {}
        if self.supabase:
            self._load_manufacturers()
        
        # Load retailer ID
        self.retailer_id = None
        if self.supabase:
            self._load_retailer()

    def _load_manufacturers(self):
        """Load manufacturers into memory for quick lookup"""
        try:
            response = self.supabase.table('manufacturer').select('*').execute()
            self.manufacturers = {m['name']: m['manufacturer_id'] for m in response.data}
            print(f"Loaded {len(self.manufacturers)} manufacturers")
        except Exception as e:
            print(f"Could not load manufacturers: {e}")

    def _load_retailer(self):
        """Load joybadminton retailer ID"""
        try:
            response = self.supabase.table('retailer').select('*').eq('name', 'joybadminton').execute()
            if response.data:
                self.retailer_id = response.data[0]['retailer_id']
                print(f"Loaded retailer: joybadminton (ID: {self.retailer_id})")
            else:
                print(" Retailer 'joybadminton' not found in database")
        except Exception as e:
            print(f"Could not load retailer: {e}")
        
    def link_racket_to_retailer(self, racket_id: int, price_usd: float, product_url: str) -> bool:
        """
        Create or update racket_retailer entry for this racket.
        
        Args:
            racket_id: ID of racket in racket table
            price_usd: Price in USD
            product_url: Full URL to product page
        """
        if not self.supabase or not self.retailer_id:
            return False
        
        try:
            # Check if link already exists
            existing = self.supabase.table('racket_retailer').select('*').eq(
                'racket_id', racket_id
            ).eq(
                'retailer_id', self.retailer_id
            ).execute()
            
            if existing.data:
                # Update existing entry (price might have changed)
                self.supabase.table('racket_retailer').update({
                    'price': price_usd,
                    'product_url': product_url
                }).eq('id', existing.data[0]['id']).execute()
                print(f"       Updated retailer link: ${price_usd:.2f}")
            else:
                # Create new entry
                self.supabase.table('racket_retailer').insert({
                    'racket_id': racket_id,
                    'retailer_id': self.retailer_id,
                    'price': price_usd,
                    'product_url': product_url
                }).execute()
                print(f"       Linked to joybadminton: ${price_usd:.2f}")
            
            return True
        except Exception as e:
            print(f"       Error linking to retailer: {e}")
            return False

    def extract_brand_from_racket_name(self, racket_name: str) -> str:
        """Extract brand from racket name using KNOWN_BRANDS"""
        name_lower = racket_name.lower()
        
        # Check KNOWN_BRANDS (longest first)
        for brand_key in sorted(KNOWN_BRANDS.keys(), key=len, reverse=True):
            if brand_key in name_lower:
                return KNOWN_BRANDS[brand_key]
        
        return None

    def get_manufacturer_id(self, brand_name: str) -> int:
        """Get manufacturer_id for a brand name"""
        return self.manufacturers.get(brand_name)

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
    
    def scrape_joybadminton_rackets(self) -> List[Dict]:
        """
        Scrape all badminton racket names from joybadminton.com
        Returns a list of dicts with `name` and `url`
        Deduplicates by base product URL to avoid color/variant duplicates
        """
        rackets = []
        seen_urls = set()  # Track unique base URLs
        base_url = "https://joybadminton.com/collections/all-badminton-rackets"
        page = 1
        
        while True:
            if page == 1:
                url = base_url
            else:
                url = f"{base_url}?page={page}"
            
            soup = self.fetch_page(url)
            if not soup:
                break
            
            # Find all product links - adjust selectors based on joybadminton.com structure
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
                
                # Extract name from link, filtering out unwanted text
                name = link.get_text(strip=True)
                
                # Remove common non-product text
                name = re.sub(r'\s*(sold out|out of stock|unavailable)\s*', '', name, flags=re.IGNORECASE).strip()
                
                # Additional filtering: if name is too short or seems wrong, try alternatives
                if not name or len(name) < 5:
                    name = link.get('title', '').strip()
                
                if not name or len(name) < 5:
                    # Fallback to URL slug
                    name = base_product_url.rstrip('/').split('/')[-1]
                
                # Final check: skip if name is obviously wrong
                if any(x in name.lower() for x in ['sold out', 'out of stock', 'unavailable']):
                    print(f"   Skipping invalid product: {name}")
                    continue

                entry = {'name': name, 'url': base_product_url}
                rackets.append(entry)
            
            print(f"Page {page}: Found {len(product_links)} links, {len(seen_urls)} unique products so far")
            page += 1
            
            # Safety check to avoid infinite loop
            if page > 15:
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
            
            # Pattern 1: Key: Value format
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
    
    def get_existing_rackets(self) -> Dict[str, Dict]:
        """
        Fetch all existing rackets from Supabase.
        Returns a dict with racket name (lowercase) as key for easy lookup.
        """
        if not self.supabase:
            print("Supabase not configured, skipping database check")
            return {}
        
        try:
            response = self.supabase.table('racket').select('*').execute()
            rackets = {}
            for racket in response.data:
                name_key = racket['name'].lower()
                rackets[name_key] = racket
            print(f"Found {len(rackets)} existing rackets in database")
            return rackets
        except Exception as e:
            print(f"Error fetching existing rackets: {e}")
            return {}
    
    def name_similarity(self, name1: str, name2: str, threshold: float = 0.8) -> bool:
        """
        String similarity check to handle slight name variations.
        """
        ratio = SequenceMatcher(None, name1.lower(), name2.lower()).ratio()
        return ratio >= threshold
    
    def extract_racket_components(self, racket_name: str) -> Dict[str, str]:
        """
        Extract key components from a racket name:
        - brand: manufacturer (Yonex, Victor, Li-Ning, etc.)
        - series: product line (Astrox, Auraspeed, Axforce, etc.)
        - model: everything after series, normalized (removes colors, weights, etc.)
        
        Returns dict with normalized components for matching.
        Examples:
        'li-ning-axforce-100-ii-unstrung-badminton-racket' -> 
            brand='li-ning', series='axforce', model='100ii'
        'li-ning-axforce-100ii-green-4ug5' -> 
            brand='li-ning', series='axforce', model='100ii'
        'victor-thruster-ryuga-muse-unstrung-4u' ->
            brand='victor', series='thruster', model='ryugamuse'
        """
        name_lower = racket_name.lower()
        components = {
            'brand': None,
            'series': None,
            'model': None,
            'original_name': racket_name,
        }
        
        # Extract brand - find the first match (longer brands first)
        for brand_key in sorted(KNOWN_BRANDS.keys(), key=len, reverse=True):
            pos = name_lower.find(brand_key)
            if pos >= 0:
                components['brand'] = brand_key
                brand_match_pos = pos
                break
        
        if components['brand'] is None:
            return components
        
        # Extract series - find the FIRST series match AFTER the brand
        brand_end = brand_match_pos + len(components['brand'])
        earliest_series_pos = len(name_lower)  # Start with end of string
        
        for series_key in sorted(KNOWN_SERIES.keys(), key=len, reverse=True):  # Try longer matches first
            pos = name_lower.find(series_key, brand_end)  # Search after brand
            if pos >= 0 and pos < earliest_series_pos:
                components['series'] = series_key
                earliest_series_pos = pos
        
        # Extract model: everything after the series, normalized
        if components['series'] is not None:
            series_end = earliest_series_pos + len(components['series'])
            model_text = name_lower[series_end:].strip('-_ ')
            
            # Remove parentheses and their content (e.g., "(Blueberry Purple)" -> "")
            model_text = re.sub(r'\s*\([^)]*\)\s*', ' ', model_text)
            
            # Remove any remaining special characters and clean up dashes
            model_text = re.sub(r'[\-–—]+', ' ', model_text).strip()
            
            # Split into words
            words = re.split(r'[-_\s]+', model_text)
            
            # Remove empty words first
            words = [w.strip() for w in words if w.strip()]
            
            # Filter and clean each word
            filtered_words = []
            for i, word in enumerate(words):
                # Skip words that should be filtered (using the improved function)
                if should_filter_word(word, i, len(words)):  #  USE THE HELPER FUNCTION
                    continue
                
                # Keep this word
                filtered_words.append(word)
            
            # Join words together
            if filtered_words:
                model = ''.join(filtered_words)
                components['model'] = model

        return components
    
    def build_racket_signature(self, components: Dict[str, str]) -> str:
        """
        Build a normalized signature for matching.
        Uses: manufacturer_series_model
        Ignores color, weight, and other variations.
        
        Examples:
        - 'li-ning_axforce_100ii'
        - 'victor_thruster_ryugamuse'
        - 'yonex_astrox_88d'
        """
        parts = []
        if components.get('brand'):
            parts.append(components['brand'])
        if components.get('series'):
            parts.append(components['series'])
        if components.get('model'):
            parts.append(components['model'])
        
        return '_'.join(parts) if parts else None
    
    def get_racket_prefix(self, name: str, num_words: int = 5) -> str:
        """
        Extract first N words from a racket name to use for matching.
        This assumes the product identifier is in the first few words before colors/weights.
        
        Normalizes spaces and dashes to be consistent across different naming conventions.
        
        Example: "li-ning-axforce-100-ii-unstrung-badminton-racket" → "li-ning-axforce-100-ii"
        Example: "Victor x Baby Milo Store..." → "victor-x-baby-milo-store..."
        """
        # Normalize: remove parentheses content and convert spaces to dashes
        normalized = name.lower()
        # Remove anything in parentheses
        normalized = re.sub(r'\s*\([^)]*\)\s*', ' ', normalized)
        # Convert spaces to dashes for consistency
        normalized = re.sub(r'\s+', '-', normalized)
        # Remove extra dashes
        normalized = re.sub(r'-+', '-', normalized)
        
        # Split on dashes and filter out empty strings
        parts = [p for p in normalized.split('-') if p]
        # Take first N parts
        prefix = '-'.join(parts[:num_words])
        return prefix
    
    def find_existing_racket_by_components(self, new_racket_name: str, existing_rackets: Dict[str, Dict]) -> Optional[Dict]:
        """
        Multi-strategy matching that actually works.
        
        Strategies:
        1. Exact name match (fastest)
        2. Signature match (for clean names - your original approach)
        3. Fuzzy match (for everything else - handles all edge cases)
        """
        
        # Strategy 1: Exact match
        exact_match = existing_rackets.get(new_racket_name.lower())
        if exact_match:
            print(f"    → Exact match")
            return exact_match
        
        # Strategy 2: Signature match (when components extract cleanly)
        new_components = self.extract_racket_components(new_racket_name)
        new_signature = self.build_racket_signature(new_components)
        
        if new_signature:
            for existing_name, existing_record in existing_rackets.items():
                existing_components = self.extract_racket_components(existing_name)
                existing_signature = self.build_racket_signature(existing_components)
                
                if existing_signature and new_signature == existing_signature:
                    print(f"    → Signature match: {existing_name}")
                    return existing_record
        
        # Strategy 2.5: Prefix match - find most similar database entry
        best_prefix_match = None
        best_prefix_match_name = None
        best_similarity = 0.0

        new_normalized = self.get_racket_prefix(new_racket_name, num_words=10).lower()

        for existing_name, existing_record in existing_rackets.items():
            existing_normalized = self.get_racket_prefix(existing_name, num_words=10).lower()
            
            similarity = SequenceMatcher(None, new_normalized, existing_normalized).ratio()
            
            new_prefix_3 = self.get_racket_prefix(new_racket_name, num_words=3)
            existing_prefix_3 = self.get_racket_prefix(existing_name, num_words=3)
            
            # Threshold: 0.78 (tested to distinguish correct from incorrect matches)
            if new_prefix_3 == existing_prefix_3 and similarity > best_similarity and similarity >= 0.78:
                best_similarity = similarity
                best_prefix_match = existing_record
                best_prefix_match_name = existing_name

        if best_prefix_match:
            print(f"    → Prefix match ({best_similarity:.2f}): {best_prefix_match_name}")
            return best_prefix_match
        
        # Strategy 3: Fuzzy match (handles all the edge cases)
        best_match = None
        best_match_name = None
        best_score = 0.0
        THRESHOLD = 0.80 
        
        for existing_name, existing_record in existing_rackets.items():
            score = fuzzy_match_score(new_racket_name, existing_name)
            
            if score > best_score and score >= THRESHOLD:
                best_score = score
                best_match = existing_record
                best_match_name = existing_name
        
        if best_match:
            print(f"    → Fuzzy match ({best_score:.2f}): {best_match_name}")
            return best_match
        
        return None
    
    def has_missing_specs(self, existing_racket: Dict) -> List[str]:
        """
        Check which specifications are NULL in the existing racket.
        Returns list of field names that are NULL.
        """
        spec_fields = ['stiffness', 'balance', 'weight', 'max_tension', 'color']
        missing = []
        for field in spec_fields:
            value = existing_racket.get(field)
            # Check if NULL/None/empty
            if value is None or value == '' or str(value).upper() == 'NULL':
                missing.append(field)
        return missing
    
    def update_missing_specs(self, racket_id: int, existing_racket: Dict, new_specs: Dict) -> bool:
        """
        Update NULL specifications in existing racket with data from new scrape.
        Maps normalized specs to database columns.
        """
        if not self.supabase:
            return False
        
        spec_mapping = {
            'Weight': 'weight',
            'Balance': 'balance',
            'Shaft Flexibility': 'stiffness',
            'Color': 'color',
            'Maximum Racket Tension': 'max_tension',
        }
        
        updates = {}
        
        for spec_key, db_column in spec_mapping.items():
            # Only update if the database field is NULL and we have new data
            if existing_racket.get(db_column) is None and spec_key in new_specs:
                updates[db_column] = new_specs[spec_key]
        
        if not updates:
            return False
        
        try:
            print(f"  Updating racket ID {racket_id} with specs: {list(updates.keys())}")
            response = self.supabase.table('racket').update(updates).eq('racket_id', racket_id).execute()
            return True
        except Exception as e:
            print(f"  Error updating racket {racket_id}: {e}")
            return False
    
    def add_new_racket(self, new_racket_data: Dict) -> bool:
        """
        Add a new racket to the database and link to retailer.
        """
        if not self.supabase:
            return False
        
        specs = new_racket_data.get('specifications', {})
        
        # Parse price (already in USD for Joy Badminton - uses CAD * 0.75 conversion)
        price = new_racket_data.get('price')
        if isinstance(price, str):
            try:
                price = float(price.replace('$', '').replace(',', ''))
            except:
                price = None
        
        # Extract brand and get manufacturer_id
        brand = self.extract_brand_from_racket_name(new_racket_data['name'])
        manufacturer_id = self.get_manufacturer_id(brand) if brand else None
        
        racket_record = {
            'name': new_racket_data['name'],
            'manufacturer_id': manufacturer_id,
            'color': specs.get('Color'),
            'balance': specs.get('Balance'),
            'stiffness': specs.get('Shaft Flexibility'),
            'weight': specs.get('Weight'),
            'max_tension': specs.get('Maximum Racket Tension'),
            'img_url': new_racket_data.get('image_url'),
            'description': new_racket_data.get('description'),
        }
        
        # Remove None values
        racket_record = {k: v for k, v in racket_record.items() if v is not None}
        
        try:
            print(f"   Adding new racket: {new_racket_data['name']} (Brand: {brand})")
            response = self.supabase.table('racket').insert(racket_record).execute()
            
            # Get the newly created racket_id
            new_racket_id = response.data[0]['racket_id']
            
            # Link to retailer with price and URL
            if price and new_racket_data.get('url'):
                self.link_racket_to_retailer(new_racket_id, price, new_racket_data['url'])
            
            return True
        except Exception as e:
            print(f"   Error adding new racket {new_racket_data['name']}: {e}")
            return False

    
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
                print(f" Database import successful: {result.get('message')}")
            else:
                print(f" Database import failed: {result.get('error')}")
                if result.get('details'):
                    print(f"  Details: {result.get('details')}")
                if result.get('hint'):
                    print(f"  Hint: {result.get('hint')}")
        else:
            print(f" API returned status {response.status_code}")
            print(f"  Error: {result.get('error', 'Unknown error')}")
            if result.get('details'):
                print(f"  Details: {result.get('details')}")
            if result.get('hint'):
                print(f"  Hint: {result.get('hint')}")
                
    except requests.exceptions.ConnectionError:
        print(" Could not connect to API endpoint at http://localhost:3000")
        print("  Make sure your Next.js dev server is running: npm run dev")
    except Exception as e:
        print(f" Error importing to database: {e}")
    
def should_filter_word(word: str, position: int, total_words: int) -> bool:
    """
    Determine if a word should be filtered out.
    Returns True if the word should be removed from the model name.
    Takes position into account - numbers at the start are likely model numbers.
    """
    word_lower = word.lower()
    
    # Only filter truly generic noise words
    generic_noise = {
        'unstrung', 'strung', 'badminton', 'racket', 'racquette',
        'edition', 'version', 'model', 'store', 'official',
        'preorder', 'pre', 'order',
    }
    
    if word_lower in generic_noise:
        return True
    
    # Filter standard colors only
    standard_colors = {
        'red', 'blue', 'green', 'yellow', 'white', 'black', 
        'purple', 'pink', 'orange', 'violet', 'jungle', 'camo',
    }
    
    if word_lower in standard_colors:
        return True
    
    # Filter weight/grip codes
    weight_patterns = [
        r'^\d*u\d*$', r'^ug\d+$', r'^g\d+$', 
        r'^\d+ug\d+$', r'^aypu\d+$',
    ]
    
    for pattern in weight_patterns:
        if re.match(pattern, word_lower):
            return True
    
    return False  # Keep everything else!


def main():
    """Main execution function"""
    # Get Supabase credentials from environment
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    # Initialize scraper
    scraper = JoyBadmintonScraper(supabase_url, supabase_key)
    
    print("=" * 70)
    print("Joy Badminton Racket Scraper - Smart Database Updater")
    print("=" * 70)
    
    # Scrape racket listings
    print("\nScraping badminton rackets from joybadminton.com...")
    racket_entries = scraper.scrape_joybadminton_rackets()

    if not racket_entries:
        print(" No rackets found. Check if the site is accessible and selectors are correct.")
        return
    
    print(f"\n Found {len(racket_entries)} unique racket entries")
    print("Sample rackets:")
    for entry in racket_entries[:5]:
        print(f"  - {entry['name']}")
    
    # Get existing rackets from database
    print("\n" + "=" * 70)
    print("Checking database...")
    print("=" * 70)
    existing_rackets = scraper.get_existing_rackets()
    
    # Process rackets: check database, update or add
    print("\nProcessing rackets...")
    print("-" * 70)
    
    stats = {
        'total_scraped': len(racket_entries),
        'new_added': 0,
        'specs_updated': 0,
        'already_exists': 0,
        'skipped': 0,
    }
    
    new_rackets_to_add = []
    
    for i, entry in enumerate(racket_entries, 1):
        print(f"\n[{i}/{len(racket_entries)}] Processing: {entry['name']}")
        
        try:
            # Scrape detailed information
            details = scraper.scrape_product_details(entry['url'])
            if not details:
                print("  ✗ Failed to scrape details")
                stats['skipped'] += 1
                continue
            
            details['name'] = entry['name']
            
            # Normalize specifications
            normalized = scraper.normalize_specifications([details])[0]
            specs = normalized.get('specifications', {})
            
            # Extract components for debugging
            components = scraper.extract_racket_components(entry['name'])
            signature = scraper.build_racket_signature(components)
            print(f"  → Components: brand={components['brand']}, series={components['series']}, model={components['model']}")
            if signature:
                print(f"  → Signature: {signature}")
            
            # Try to find existing racket
            existing_racket = scraper.find_existing_racket_by_components(entry['name'], existing_rackets)
            
            if existing_racket:
                print(f"  ℹ Already in database (ID: {existing_racket['racket_id']})")
                stats['already_exists'] += 1
                
                # Check and update missing specs
                missing_fields = scraper.has_missing_specs(existing_racket)
                if missing_fields:
                    if scraper.update_missing_specs(existing_racket['racket_id'], existing_racket, specs):
                        stats['specs_updated'] += 1
                        print(f"  Updated missing specs: {', '.join(missing_fields)}")

                price = normalized.get('price')
                product_url = entry.get('url')
                
                if price and product_url:
                    scraper.link_racket_to_retailer(existing_racket['racket_id'], price, product_url)
                    
            else:
                # Add to new rackets list
                new_rackets_to_add.append(normalized)
                print(f"   Will be added to database")
                stats['new_added'] += 1
            
        except Exception as e:
            print(f"   Error processing racket: {e}")
            stats['skipped'] += 1
    
    # Add new rackets to database
    if new_rackets_to_add:
        print("\n" + "=" * 70)
        print(f"Adding {len(new_rackets_to_add)} new rackets to database...")
        print("-" * 70)
        
        for racket in new_rackets_to_add:
            if scraper.add_new_racket(racket):
                pass  # Counter already incremented
            else:
                stats['new_added'] -= 1
                stats['skipped'] += 1
    
    # Save summary
    gathering_dir = 'scripts/gathering'
    if not os.path.isdir(gathering_dir):
        os.makedirs(gathering_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    summary = {
        'timestamp': timestamp,
        'statistics': stats,
    }
    
    summary_file = os.path.join(gathering_dir, f'joy_scraper_summary_{timestamp}.json')
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total rackets scraped:        {stats['total_scraped']}")
    print(f"New rackets added:            {stats['new_added']}")
    print(f"Existing rackets found:       {stats['already_exists']}")
    print(f"Specs updated:                {stats['specs_updated']}")
    print(f"Skipped:                      {stats['skipped']}")
    print(f"\nSummary saved to: {summary_file}")
    print("=" * 70)


def test_component_matching():
    """
    Utility function to test prefix-based matching.
    Run with: python joy_scraper.py test
    """
    scraper = JoyBadmintonScraper()
    
    # Test cases showing how the same racket should match across different names
    test_cases = [
        ("li-ning-axforce-100-ii-unstrung-badminton-racket", "li-ning-axforce-100ii-green-4ug5"),
        ("yonex-astrox-88d-pro", "yonex-astrox-88d-pro-white"),
        ("victor-auraspeed-fantome", "victor-auraspeed-fantome--3ug4"),
        ("victor-thruster-ryuga-muse", "victor-thruster-ryuga-muse-unstrung-4u"),
        ("yonex-nanoray-z-speed", "yonex-nanoray-z-speed-black-unstrung"),
        ("victor-auraspeed-90k", "victor-auraspeed-90k-blue"),
        ("Victor x Baby Milo Store Thruster Racket TK-BABY-MILO-G (Jungle Green)", "victor-x-baby-milo-store-unstrung-badminton-racket-tk-babymilo-g-jungle-camo"),
        ("li-ning-bladex-700-un-strung-badminton-racket-yellow-aypu015-3", "li-ning-bladex-700-yellow-3u-unstrung-badminton-racket"),
    ]
    
    print("=" * 70)
    print("TESTING PREFIX-BASED MATCHING (First 3-5 Words)")
    print("=" * 70)
    
    for name1, name2 in test_cases:
        print(f"\nComparing:")
        print(f"  Name 1: {name1}")
        print(f"  Name 2: {name2}")
        
        prefix1_3 = scraper.get_racket_prefix(name1, num_words=3)
        prefix1_4 = scraper.get_racket_prefix(name1, num_words=4)
        prefix1_5 = scraper.get_racket_prefix(name1, num_words=5)
        
        prefix2_3 = scraper.get_racket_prefix(name2, num_words=3)
        prefix2_4 = scraper.get_racket_prefix(name2, num_words=4)
        prefix2_5 = scraper.get_racket_prefix(name2, num_words=5)
        
        print(f"\n  Name 1 prefix (3 words): {prefix1_3}")
        print(f"  Name 1 prefix (4 words): {prefix1_4}")
        print(f"  Name 1 prefix (5 words): {prefix1_5}")
        
        print(f"\n  Name 2 prefix (3 words): {prefix2_3}")
        print(f"  Name 2 prefix (4 words): {prefix2_4}")
        print(f"  Name 2 prefix (5 words): {prefix2_5}")
        
        match_5 = prefix1_5 == prefix2_5
        match_4 = prefix1_4 == prefix2_4
        match_3 = prefix1_3 == prefix2_3
        
        if match_5:
            print(f"   MATCH via 5-word prefix")
        elif match_4:
            print(f"   MATCH via 4-word prefix")
        elif match_3:
            print(f"   MATCH via 3-word prefix")
        else:
            print(f"  NO MATCH")
        
        print("-" * 70)


if __name__ == "__main__":
    import sys
    
    # Allow running tests with: python joy_scraper.py test
    # Or diagnostics with: python joy_scraper.py diagnose
    if len(sys.argv) > 1 and sys.argv[1].lower() == 'test':
        test_component_matching()
    elif len(sys.argv) > 1 and sys.argv[1].lower() == 'diagnose':
        diagnose_database_names()
    else:
        main()

