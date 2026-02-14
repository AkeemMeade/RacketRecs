import requests
from bs4 import BeautifulSoup
import time
import json
import csv
from typing import List, Dict, Optional
import os
import re


class BadmintonRacketScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/91.0.4472.124 Safari/537.36"
            )
        }
        self.session = requests.Session()
        self.delay = 1.5  # seconds between requests

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a page and return BeautifulSoup, or None on error."""
        try:
            print(f"Fetching: {url}")
            r = self.session.get(url, headers=self.headers, timeout=15)
            r.raise_for_status()
            time.sleep(self.delay)
            return BeautifulSoup(r.content, "html.parser")
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    # Collect product URLs
    def get_yumo_product_urls(self, max_pages: int = 20) -> List[str]:
        """
        Collect unique product URLs from the badminton rackets collection.
        """
        base_url = "https://yumo.ca/collections/badminton-rackets"
        urls = set()

        for page in range(1, max_pages + 1):
            url = base_url if page == 1 else f"{base_url}?page={page}"
            soup = self.fetch_page(url)
            if not soup:
                break

            # Many duplicates exist; use hrefs and normalize
            links = soup.find_all("a", href=lambda x: x and "/products/" in x)
            if not links:
                break

            before = len(urls)
            for a in links:
                href = a.get("href", "").strip()
                if not href:
                    continue
                if href.startswith("/"):
                    href = "https://yumo.ca" + href
                # Strip query params/fragments
                href = href.split("?")[0].split("#")[0]
                urls.add(href)

            added = len(urls) - before
            print(f"Page {page}: +{added} product urls (total {len(urls)})")

            # Heuristic: if a page adds nothing new, you’re probably done
            if added == 0 and page > 1:
                break

        return sorted(urls)

    # Parse spec lines in accordion HTML
    @staticmethod
    def _clean_text(s: str) -> str:
        return " ".join((s or "").replace("\xa0", " ").split()).strip()

    def _parse_specs_and_tech(self, desc_root: BeautifulSoup) -> Dict:
        result = {
            "description_intro": "",
            "specifications": {},
            "technologies": []
        }

        def clean(s: str) -> str:
            return " ".join((s or "").replace("\xa0", " ").split()).strip()

        # Grab intro text (first few paragraphs before specs heading)
        intro_parts = []
        for p in desc_root.find_all("p"):
            t = clean(p.get_text(" ", strip=True))
            if not t:
                continue
            low = t.lower()
            if "specification" in low or "specifications" in low or "technology" in low:
                break
            intro_parts.append(t)
        result["description_intro"] = clean(" ".join(intro_parts))

        # Specs - look for list items that look like "KEY: VALUE"
        for li in desc_root.find_all("li"):
            t = clean(li.get_text(" ", strip=True))
            if not t:
                continue

            # Expect "KEY: VALUE"
            if ":" in t:
                key, val = t.split(":", 1)
                key = clean(key).upper()
                val = clean(val)
                if key and val:
                    result["specifications"][key] = val

        # Specs (P-BASED) — some pages use paragraphs instead of lists for specs, in "Key - Value" or "Key: Value" format

        for p in desc_root.find_all("p"):
            t = clean(p.get_text(" ", strip=True))
            if not t:
                continue

            # Accept either "Key - Value" or "Key: Value"
            if " - " in t:
                key, val = t.split(" - ", 1)
            elif re.match(r"^[A-Za-z][A-Za-z /]+:\s*\S+", t):
                key, val = t.split(":", 1)
            else:
                continue

            key = clean(key).rstrip(":").upper()
            val = clean(val)
            if key and val:
                # don't overwrite LI-based specs if already captured
                result["specifications"].setdefault(key, val)


        # Technology sections: look for strong tags that might indicate tech names, then grab description from nearby text
        tech_headers = desc_root.select("p.inline-richtext strong")
        for strong in tech_headers:
            name = clean(strong.get_text(" ", strip=True))
            if not name:
                continue
            header_p = strong.find_parent("p")
            desc = ""
            if header_p:
                nxt = header_p.find_next_sibling()
                if nxt and getattr(nxt, "get", None) and "rte" in (nxt.get("class") or []):
                    desc = clean(nxt.get_text(" ", strip=True))
                else:
                    div = header_p.find_next("div", class_="rte")
                    if div:
                        desc = clean(div.get_text(" ", strip=True))

            result["technologies"].append({"name": name, "description": desc})

        return result


    # Scrape one product page
    def scrape_product_details(self, product_url: str) -> Optional[Dict]:
        soup = self.fetch_page(product_url)
        if not soup:
            return None

        # Product name (page has an H1)
        h1 = soup.find("h1")
        name = self._clean_text(h1.get_text(" ", strip=True)) if h1 else ""

        # Price: try common Shopify patterns; fallback to any "$" near product section
        price = ""
        price_candidates = soup.select("[data-product-price], .price, .product__price, .price-item")
        for el in price_candidates:
            t = self._clean_text(el.get_text(" ", strip=True))
            if "$" in t:
                price = t
                break

        # Description accordion root: this matches your pasted HTML
        desc_root = soup.select_one("div.cc-accordion-item__content.rte.cf")
        if not desc_root:
            # fallback: any content block that contains "Product Specification:"
            for div in soup.select("div"):
                if "Product Specification" in div.get_text(" ", strip=True):
                    desc_root = div
                    break

        parsed = {"description_intro": "", "specifications": {}, "technologies": []}
        if desc_root:
            parsed = self._parse_specs_and_tech(desc_root)

        return {
            "url": product_url,
            "name": name,
            "price": price,
            "description_intro": parsed["description_intro"],
            "specifications": parsed["specifications"],
            "technologies": parsed["technologies"],
        }

    # Scrape ALL rackets
    def scrape_all_rackets_with_specs(self, max_pages: int = 20) -> List[Dict]:
        product_urls = self.get_yumo_product_urls(max_pages=max_pages)
        print(f"Total product URLs collected: {len(product_urls)}")

        all_data = []
        for i, url in enumerate(product_urls, 1):
            print(f"[{i}/{len(product_urls)}] Scraping: {url}")
            details = self.scrape_product_details(url)
            if details:
                all_data.append(details)

        return all_data

    def save_to_json(self, data: List[Dict], filename: str):
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(data)} items to {filename}")

    def save_to_csv_flattened_specs(self, data: List[Dict], filename: str):
        """
        CSV is tricky because specs are dynamic. This flattens specs into columns.
        """
        if not data:
            print("No data to save")
            return

        # Collect all spec keys
        spec_keys = set()
        for item in data:
            for k in (item.get("specifications") or {}).keys():
                spec_keys.add(k)
        spec_keys = sorted(spec_keys)

        fieldnames = ["name", "price", "url", "description_intro"] + spec_keys

        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for item in data:
                row = {
                    "name": item.get("name", ""),
                    "price": item.get("price", ""),
                    "url": item.get("url", ""),
                    "description_intro": item.get("description_intro", ""),
                }
                specs = item.get("specifications") or {}
                for k in spec_keys:
                    row[k] = specs.get(k, "")
                writer.writerow(row)

        print(f"Saved {len(data)} items to {filename}")


if __name__ == "__main__":
    scraper = BadmintonRacketScraper()
    data = scraper.scrape_all_rackets_with_specs(max_pages=20)

    os.makedirs("scripts/gathering", exist_ok=True)
    scraper.save_to_json(data, "scripts/gathering/yumo_rackets_full.json")
    scraper.save_to_csv_flattened_specs(data, "scripts/gathering/yumo_rackets_full.csv")
