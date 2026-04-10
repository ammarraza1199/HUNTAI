import random
import time
import logging
import urllib.parse
from typing import List, Dict, Any
from datetime import datetime, timezone

from seleniumbase import Driver
from selenium.webdriver.common.by import By

import config
from utils.time_parser import parse_posted_time

logger = logging.getLogger(__name__)

class IndeedSBScraper:
    def __init__(self):
        self.platform = "indeed"
        self.base_url = "https://www.indeed.com"

    def _create_search_url(self, query: str, location: str) -> str:
        q = urllib.parse.quote_plus(query)
        loc = urllib.parse.quote_plus(location)
        return f"{self.base_url}/jobs?q={q}&l={loc}&{config.URL_FILTERS['indeed']}"

    def scrape(self, query: str, location: str, max_jobs: int = 20) -> List[Dict[str, Any]]:
        logger.info("🚀 [SB ENGINE] STARTING INDEED SCRAPER for '%s'", query)
        url = self._create_search_url(query, location)
        
        driver = Driver(uc=True, headless=config.HEADLESS)
        jobs = []
        
        try:
            driver.get(url)
            time.sleep(random.uniform(3, 5))
            
            # Simple Indeed Extraction
            cards = driver.find_elements(By.CSS_SELECTOR, ".job_seen_atlas, .result, .uoc-Card")
            logger.debug("SB-Indeed: Found %d cards.", len(cards))
            
            for card in cards:
                if len(jobs) >= max_jobs: break
                try:
                    title = card.find_element(By.CSS_SELECTOR, "h2.jobTitle").text.strip()
                    company = card.find_element(By.CSS_SELECTOR, "[data-testid='company-name']").text.strip()
                    loc = card.find_element(By.CSS_SELECTOR, "[data-testid='text-location']").text.strip()
                    
                    link = card.find_element(By.CSS_SELECTOR, "a.jcs-JobTitle").get_attribute("href")
                    
                    jobs.append({
                        "platform": self.platform,
                        "title": title,
                        "company": company,
                        "location": loc,
                        "url": link,
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                        "posted_hours": 1.0
                    })
                except: continue
                
        except Exception as e:
            logger.error("SB-Indeed failed: %s", e)
        finally:
            driver.quit()
            
        return jobs
