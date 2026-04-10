import random
import time
import logging
import urllib.parse
from typing import List, Dict, Any
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright, Page, Locator

import config
from utils.time_parser import parse_posted_time
from utils.fingerprint_spoofer import apply_stealth, set_realistic_headers, random_user_agent
from utils.retry_handler import retry_call

logger = logging.getLogger(__name__)

class IndeedScraper:
    """
    Scraper for Indeed.
    Handles CAPTCHAs, pagination, relative timestamps, and DOM variations.
    """
    def __init__(self):
        self.platform = "indeed"
        self.base_url = config.INDEED_BASE_URL
        
    def _create_search_url(self, query: str, location: str, start: int = 0) -> str:
        # Example Indeed URL: https://www.indeed.com/jobs?q=python+developer&l=hyderabad&fromage=1&start=10
        q = urllib.parse.quote_plus(query)
        loc = urllib.parse.quote_plus(location)
        url = f"{self.base_url}/jobs?q={q}&l={loc}&{config.URL_FILTERS['indeed']}"
        if start > 0:
            url += f"&start={start}"
        return url

    def scrape(self, query: str, location: str, max_jobs: int = config.MAX_JOBS_PER_PLATFORM) -> List[Dict[str, Any]]:
        logger.info("STARTING INDEED SCRAPER for '%s' in '%s'", query, location)
        jobs = []
        
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=config.HEADLESS,
                # Add anti-automation flags
                args=["--disable-blink-features=AutomationControlled"]
            )
            
            context = browser.new_context(
                viewport={"width": random.randint(1366, 1920), "height": random.randint(768, 1080)},
                user_agent=random_user_agent(),
                java_script_enabled=True,
            )
            set_realistic_headers(context)
            page = context.new_page()
            
            # Additional stealth layer
            apply_stealth(page)

            try:
                # Add initial randomization delay
                time.sleep(random.uniform(config.DELAY_MIN, config.DELAY_MAX))
                
                # Navigate through pages
                jobs = self._paginate(page, query, location, max_jobs)
                
            except Exception as e:
                logger.error("Indeed scraping failed: %s", e)
            finally:
                context.close()
                browser.close()
                
            return jobs

    def _paginate(self, page: Page, query: str, location: str, max_jobs: int) -> List[Dict[str, Any]]:
        jobs = []
        start = 0
        seen_identifiers = set()
        
        for page_num in range(config.MAX_PAGES_INDEED):
            if len(jobs) >= max_jobs:
                logger.info("Indeed: Reached max_jobs limit (%d).", max_jobs)
                break
                
            url = self._create_search_url(query, location, start)
            logger.info("Indeed Page %d: Navigating to %s", page_num + 1, url)
            
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=config.NAVIGATION_TIMEOUT)
            except Exception as str_exc:
                logger.error("Indeed: Error loading page %d: %s", page_num + 1, str_exc)
                break
                
            # Random wait (human-like reading)
            page.wait_for_timeout(random.randint(2000, 5000))
            
            # Check for CAPTCHA (id or text)
            if self._detect_captcha(page):
                logger.warning("Indeed CAPTCHA detected. Stopping scraper early.")
                break
                
            # Target structural selectors wrapper
            try:
                # Need to select job cards
                page.wait_for_selector("div.job_seen_beacon, div.slider_container", timeout=10000)
                card_locators = page.locator("div.job_seen_beacon, div.slider_container, td.resultContent")
                count = card_locators.count()
            except Exception:
                logger.warning("Indeed: No job cards found on page %d.", page_num + 1)
                break
            
            new_jobs = 0
            
            for i in range(count):
                if len(jobs) >= max_jobs:
                    break
                    
                card = card_locators.nth(i)
                job_data = self._extract_job_card(card)
                
                iden = f"{job_data.get('title')}|{job_data.get('company')}"
                if job_data.get("title") and iden not in seen_identifiers:
                    jobs.append(job_data)
                    seen_identifiers.add(iden)
                    new_jobs += 1
            
            logger.info("Indeed Page %d: Extracted %d new jobs.", page_num + 1, new_jobs)
            
            if new_jobs < 10:  # Typically indeed has 15 on a page. If <10, we're likely out of results
                logger.info("Indeed: Few new jobs found (%d). Likely end of results.", new_jobs)
                break
                
            start += 10 # Indeed pagination starts at 0, 10, 20...
            
            # Random wait before next page
            time.sleep(random.uniform(config.DELAY_MIN, config.DELAY_MAX))

        return jobs

    def _detect_captcha(self, page: Page) -> bool:
        """Check for known CAPTCHA elements on Indeed."""
        try:
            content = page.content().lower()
            if "hcaptcha" in content or "cf-turnstile" in content or 'id="captcha-box"' in content:
                return True
                
            # Looking for typical Cloudflare/PerimeterX challenge boxes
            captcha_frame = page.locator("iframe[src*='captcha'], div#cf-please-wait").count()
            if captcha_frame > 0:
                return True
                
            return False
        except Exception:
            return False

    def _extract_job_card(self, card: Locator) -> Dict[str, Any]:
        """Wrap each extraction in try/except with fallback chains."""
        data = {
            "platform": self.platform,
            "title": "",
            "company": "",
            "location": "",
            "url": "",
            "posted_raw": "",
            "posted_hours": float("inf"),
            "posted_utc": "",
            "description": "",
            "salary": "",
            "hr_contact": "",
            "scraped_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Title (Primary: [data-testid="job-title"] -> Fallback: h2.jobTitle a)
        try:
            title_node = card.locator('[data-testid="job-title"], h2.jobTitle span, h2 span[id^="jobTitle"]')
            if title_node.count() > 0:
                data["title"] = title_node.first.inner_text().strip()
                
            # Try to get URL from parent 'a' tag
            link_node = card.locator('a[data-jx-job-title], h2.jobTitle a, a.jcs-JobTitle')
            if link_node.count() > 0:
                href = link_node.first.get_attribute("href")
                if href:
                    data["url"] = self.base_url + href if href.startswith('/') else href
        except Exception:
            pass

        # Company
        try:
            comp_node = card.locator('[data-testid="company-name"], span.companyName, div.company_location [data-testid="company-name"]')
            if comp_node.count() > 0:
                data["company"] = comp_node.first.inner_text().strip()
        except Exception:
            pass

        # Location
        try:
            loc_node = card.locator('[data-testid="text-location"], div.companyLocation')
            if loc_node.count() > 0:
                data["location"] = loc_node.first.inner_text().strip()
        except Exception:
            pass

        # Salary
        try:
            sal_node = card.locator('div.salary-snippet-container, div.metadataContainer [data-testid="attribute_snippet_testid"]')
            if sal_node.count() > 0:
                data["salary"] = sal_node.first.inner_text().strip()
        except Exception:
            pass

        # Timestamp
        try:
            time_node = card.locator('[data-testid="myJobsStateDate"], span.date')
            if time_node.count() > 0:
                raw_time = time_node.first.inner_text().strip()
                parsed = parse_posted_time(raw_time)
                data["posted_raw"] = parsed["raw"]
                data["posted_hours"] = parsed["hours"]
                data["posted_utc"] = parsed["abs_utc"]
        except Exception:
            data["posted_raw"] = "unknown"
            
        # Description excerpt
        try:
            desc_node = card.locator('div.job-snippet, div[style*="line-height"]')
            if desc_node.count() > 0:
                data["description"] = desc_node.first.inner_text().replace('\n', ' ').strip()
        except Exception:
            pass

        return data
