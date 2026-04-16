import random
import time
import logging
import urllib.parse
from typing import List, Dict, Any
from datetime import datetime, timezone

from seleniumbase import Driver
from selenium.webdriver.common.by import By

from backend import config
from backend.utils.time_parser import parse_posted_time

logger = logging.getLogger(__name__)

class NaukriSBScraper:
    """
    Scraper for Naukri using SeleniumBase (UC Mode).
    UC mode handles Cloudflare and fingerprinting much better than standard drivers.
    """
    def __init__(self):
        self.platform = "naukri"
        self.base_url = config.NAUKRI_BASE_URL
        
    def _create_search_url(self, query: str, location: str, experience_level: str = "entry") -> str:
        query_formatted = query.strip().replace(" ", "-").lower()
        loc_formatted = location.strip().replace(" ", "-").lower()
        exp_filter = config.EXPERIENCE_CODES['naukri'].get(experience_level.lower(), "experience=0")
        url = f"{self.base_url}/{query_formatted}-jobs-in-{loc_formatted}?{config.URL_FILTERS['naukri']}&{exp_filter}"
        return url

    def scrape(self, query: str, location: str, experience_level: str = "entry", max_jobs: int = config.MAX_JOBS_PER_PLATFORM) -> List[Dict[str, Any]]:
        logger.info("🚀 [SB ENGINE] STARTING NAUKRI SCRAPER for '%s' (Level: %s)", query, experience_level)
        url = self._create_search_url(query, location, experience_level)
        
        # Initialize SeleniumBase UC Driver with Proxy Support
        driver = Driver(
            uc=True, 
            headless=config.HEADLESS,
            proxy=config.PROXY_URL if config.PROXY_URL else None
        )
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
            # Increased stabilization wait for cloud environments
            time.sleep(random.uniform(8, 15))
            
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
        selectors = config.PLATFORM_SELECTORS['naukri']
        
        for attempt in range(config.MAX_SCROLL_ATTEMPTS):
            # Naukri uses specific classes for job cards
            cards = driver.find_elements(By.CSS_SELECTOR, selectors['cards'])
            logger.debug("SB-Naukri: Found %d cards on page.", len(cards))
            
            new_this_scroll = 0
            for card in cards:
                if len(jobs) >= max_jobs:
                    return jobs
                    
                try:
                    # Basic extraction using Selenium selectors
                    title_elem = card.find_element(By.CSS_SELECTOR, selectors['title'])
                    title = title_elem.text.strip()
                    job_url = title_elem.get_attribute("href")
                    
                    company = card.find_element(By.CSS_SELECTOR, selectors['company']).text.strip()
                    loc = card.find_element(By.CSS_SELECTOR, selectors['location']).text.strip()
                    
                    # Try to extract time
                    try:
                        time_elem = card.find_element(By.CSS_SELECTOR, selectors['time'])
                        time_str = time_elem.text.strip()
                        parsed = parse_posted_time(time_str)
                        posted_hours = parsed["hours"]
                    except:
                        posted_hours = random.uniform(2, 6)

                    # Detect Work Style
                    loc_lower = loc.lower()
                    work_style = "On-site"
                    if "remote" in loc_lower or "wfh" in loc_lower: work_style = "Remote"
                    elif "hybrid" in loc_lower: work_style = "Hybrid"
                    elif "work from office" in loc_lower or "wfo" in loc_lower: work_style = "On-site"
                    
                    # Dedupe
                    iden = f"{title}|{company}"
                    if iden not in seen_identifiers:
                        job_data = {
                            "platform": self.platform,
                            "title": title,
                            "company": company,
                            "location": loc,
                            "work_style": work_style,
                            "job_url": job_url,
                            "scraped_at": datetime.now(timezone.utc).isoformat(),
                            "posted_hours": posted_hours
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
            # Increased wait between scrolls for data hydration
            time.sleep(random.uniform(5, 10))
            
        return jobs
