import os
import re
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
project_root = Path(__file__).resolve().parents[1]
load_dotenv(project_root / '.env.local')

# Brand name mappings (handle variations)
BRAND_MAPPINGS = {
    'yonex': 'Yonex',
    'victor': 'Victor',
    'li-ning': 'Li-Ning',
    'lining': 'Li-Ning',
    'li ning': 'Li-Ning',
    'hundred': 'Hundred',
    'ashaway': 'Ashaway',
    'apacs': 'Apacs',
    'mizuno': 'Mizuno',
    'gosen': 'Gosen',
    'jnice': 'Jnice',
    'technist': 'Technist',
}


def extract_brand_from_name(racket_name: str) -> str:
    """
    Extract brand name from racket name.
    
    Examples:
    - "Yonex Astrox 88D Pro" -> "Yonex"
    - "victor-auraspeed-90k" -> "Victor"
    - "Li-Ning Axforce 100" -> "Li-Ning"
    """
    name_lower = racket_name.lower()
    
    # Try to match known brands 
    for brand_key in sorted(BRAND_MAPPINGS.keys(), key=len, reverse=True):
        if brand_key in name_lower:
            return BRAND_MAPPINGS[brand_key]
    
    # Fallback: check first word
    first_word = racket_name.split()[0] if racket_name.split() else ''
    if first_word.lower() in BRAND_MAPPINGS:
        return BRAND_MAPPINGS[first_word.lower()]
    
    return None


def main():
    """Link all rackets to their manufacturers"""
    
    # Connect to Supabase
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print(" Error: Supabase credentials not found in environment")
        return
    
    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
    except ImportError:
        print(" Error: supabase-py not installed")
        print("Install it with: pip install supabase")
        return
    
    print("=" * 70)
    print("Linking Rackets to Manufacturers")
    print("=" * 70)
    
    # Step 1: Get all manufacturers
    print("\n1. Fetching manufacturers from database...")
    try:
        manufacturers_response = supabase.table('manufacturer').select('*').execute()
        manufacturers = {m['name']: m['manufacturer_id'] for m in manufacturers_response.data}
        print(f"    Found {len(manufacturers)} manufacturers:")
        for name, mid in manufacturers.items():
            print(f"      - {name} (ID: {mid})")
    except Exception as e:
        print(f"    Error fetching manufacturers: {e}")
        return
    
    # Step 2: Get all rackets
    print("\n2. Fetching rackets from database...")
    try:
        rackets_response = supabase.table('racket').select('racket_id, name, manufacturer_id').execute()
        rackets = rackets_response.data
        print(f"   Found {len(rackets)} rackets")
    except Exception as e:
        print(f"    Error fetching rackets: {e}")
        return
    
    # Step 3: Process each racket
    print("\n3. Processing rackets...")
    print("-" * 70)
    
    stats = {
        'updated': 0,
        'already_linked': 0,
        'brand_not_found': 0,
        'manufacturer_not_in_db': 0,
        'errors': 0,
    }
    
    unknown_brands = set()
    
    for i, racket in enumerate(rackets, 1):
        racket_id = racket['racket_id']
        racket_name = racket['name']
        current_manufacturer_id = racket.get('manufacturer_id')
        
        # Extract brand from name
        brand = extract_brand_from_name(racket_name)
        
        if not brand:
            stats['brand_not_found'] += 1
            unknown_brands.add(racket_name.split()[0] if racket_name.split() else racket_name[:20])
            continue
        
        # Get manufacturer_id
        manufacturer_id = manufacturers.get(brand)
        
        if not manufacturer_id:
            stats['manufacturer_not_in_db'] += 1
            print(f"    Brand '{brand}' not in manufacturer table (racket: {racket_name})")
            continue
        
        # Check if already linked
        if current_manufacturer_id == manufacturer_id:
            stats['already_linked'] += 1
            continue
        
        # Update racket
        try:
            supabase.table('racket').update({
                'manufacturer_id': manufacturer_id
            }).eq('racket_id', racket_id).execute()
            
            stats['updated'] += 1
            
            # Print progress every 50 rackets
            if stats['updated'] % 50 == 0:
                print(f"   ... {stats['updated']} rackets updated so far")
            
        except Exception as e:
            stats['errors'] += 1
            print(f"    Error updating racket {racket_id}: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total rackets processed:      {len(rackets)}")
    print(f"Successfully updated:         {stats['updated']}")
    print(f"Already linked:               {stats['already_linked']}")
    print(f"Brand not found in name:      {stats['brand_not_found']}")
    print(f"Manufacturer not in DB:       {stats['manufacturer_not_in_db']}")
    print(f"Errors:                       {stats['errors']}")
    
    if unknown_brands:
        print(f"\n Unknown brands found ({len(unknown_brands)}):")
        for brand in sorted(unknown_brands)[:10]:  # Show first 10
            print(f"  - {brand}")
        if len(unknown_brands) > 10:
            print(f"  ... and {len(unknown_brands) - 10} more")
        print("\nAdd these to BRAND_MAPPINGS in this script if they're valid brands")
    
    print("=" * 70)


if __name__ == "__main__":
    main()