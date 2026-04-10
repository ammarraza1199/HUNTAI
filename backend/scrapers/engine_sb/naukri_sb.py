import random
import time
import logging
import urllib.parse
from typing import List, Dict, Any
from datetime import datetime, timezone

from seleniumbase import Driver
from selenium.webdriver.common.by import By

from backend import config
from utils.time_parser import parse_posted_time

logger = logging.getLogger(__name__)

class NaukriSBScraper:
    """
    Scraper for Naukri using SeleniumBase (UC Mode).
    UC mode handles Cloudflare and fingerprinting much better than standard drivers.
    """
    def __init__(self):
        self.platform = "naukri"
        self.base_url = config.NAUKRI_BASE_URL
        
    def _create_search_url(self, query: str, location: str) -> str:
        query_formatted = query.strip().replace(" ", "-").lower()
        loc_formatted = location.strip().replace(" ", "-").lower()
        url = f"{self.base_url}/{query_formatted}-jobs-in-{loc_formatted}?{config.URL_FILTERS['naukri']}"
        return url

    def scrape(self, query: str, location: str, max_jobs: int = config.MAX_JOBS_PER_PLATFORM) -> List[Dict[str, Any]]:
        logger.info("🚀 [SB ENGINE] STARTING NAUKRI SCRAPER for '%s'", query)
        url = self._create_search_url(query, location)
        
        # Initialize SeleniumBase UC Driver
        driver = Driver(uc=True, headless=config.HEADLESS)
        jobs = []
        
        try:
            # 1. Session Warming
            warmup_url = random.choice(["https://www.google.com", "https://www.bing.com"])
            logger.debug("SB-Naukri: Warming up via %s", warmup_url)
            driver.get(warmup_url)
            time.sleep(random.uniform(2, 4))
            
            # 2. Main Navigation
            logger.info("SB-Naukri: Navigating to %s", url)
            driver.uc_open_with_reconnect(url, reconnect_time=4)
            time.sleep(random.uniform(3, 6))
            
            # 3. Detect Blocking
            content = driver.page_source.lower()
            if "access denied" in content or "robot" in content:
                logger.error("SB-Naukri: Bot detection tripped. Retrying with reconnect...")
                driver.uc_gui_click_captcha() # Try to click captcha if visible
                time.sleep(5)
                if "access denied" in driver.page_source.lower():
                    logger.error("SB-Naukri: Still blocked. Aborting.")
                    return []

            # 4. Extraction Logic
            jobs = self._scroll_and_extract(driver, max_jobs)
            
        except Exception as e:
            logger.error("SB-Naukri scraping failed: %s", e)
        finally:
            driver.quit()
            
        return jobs

    def _scroll_and_extract(self, driver, max_jobs: int) -> List[Dict[str, Any]]:
        jobs = []
        seen_identifiers = set()
        
        for attempt in range(config.MAX_SCROLL_ATTEMPTS):
            # Naukri uses specific classes for job cards
            cards = driver.find_elements(By.CSS_SELECTOR, "div.srp-jobtuple-wrapper, article.jobTuple")
            logger.debug("SB-Naukri: Found %d cards on page.", len(cards))
            
            new_this_scroll = 0
            for card in cards:
                if len(jobs) >= max_jobs:
                    return jobs
                    
                try:
                    # Basic extraction using Selenium selectors
                    title_elem = card.find_element(By.CSS_SELECTOR, "a.title")
                    title = title_elem.text.strip()
                    job_url = title_elem.get_attribute("href")
                    
                    company = card.find_element(By.CSS_SELECTOR, "a.comp-name").text.strip()
                    loc = card.find_element(By.CSS_SELECTOR, ".locWdth").text.strip()
                    
                    # Dedupe
                    iden = f"{title}|{company}"
                    if iden not in seen_identifiers:
                        job_data = {
                            "platform": self.platform,
                            "title": title,
                            "company": company,
                            "location": loc,
                            "url": job_url,
                            "scraped_at": datetime.now(timezone.utc).isoformat(),
                            "posted_hours": 1.0 # Minimal placeholder
                        }
                        jobs.append(job_data)
                        seen_identifiers.add(iden)
                        new_this_scroll += 1
                except Exception:
                    continue
            
            if new_this_scroll == 0 and attempt > 2:
                break
                
            # Random Human-like Scroll
            scroll_dist = random.randint(400, 800)
            driver.execute_script(f"window.scrollBy(0, {scroll_dist});")
            time.sleep(random.uniform(2, 4))
            
        return jobs
