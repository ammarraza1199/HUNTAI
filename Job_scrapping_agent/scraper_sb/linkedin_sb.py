import random
import time
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone

from seleniumbase import Driver
from selenium.webdriver.common.by import By

import config

logger = logging.getLogger(__name__)

class LinkedInSBScraper:
    def __init__(self):
        self.platform = "linkedin"
        self.base_url = "https://www.linkedin.com"

    def _create_search_url(self, query: str, location: str) -> str:
        q = query.strip().replace(" ", "%20")
        loc = location.strip().replace(" ", "%20")
        return f"{self.base_url}/jobs/search/?{config.URL_FILTERS['linkedin']}&keywords={q}&location={loc}"

    def scrape(self, query: str, location: str, max_jobs: int = 15) -> List[Dict[str, Any]]:
        logger.info("🚀 [SB ENGINE] STARTING LINKEDIN SCRAPER for '%s'", query)
        url = self._create_search_url(query, location)
        
        # Start browser in UC mode
        driver = Driver(uc=True, headless=config.HEADLESS)
        jobs = []
        
        try:
            # Session Warming via Google
            driver.get("https://www.google.com")
            time.sleep(2)
            
            # Go to LinkedIn
            logger.info("SB-LinkedIn: Navigating to %s", url)
            driver.get(url)
            time.sleep(random.uniform(5, 10))
            
            # Simple manual bypass check
            if "checkpoint/challenge" in driver.current_url or "login" in driver.current_url:
                logger.error("SB-LinkedIn: LOGIN WALL triggered. Use manual login first.")
                return []
            
            # Extract cards
            cards = driver.find_elements(By.CSS_SELECTOR, ".job-card-container, .base-card, .base-search-card")
            logger.debug("SB-LinkedIn: Found %d cards.", len(cards))
            
            for card in cards:
                if len(jobs) >= max_jobs: break
                try:
                    title_elem = card.find_element(By.CSS_SELECTOR, ".job-card-list__title, h3, .base-search-card__title")
                    title = title_elem.text.strip()
                    
                    comp_elem = card.find_element(By.CSS_SELECTOR, ".job-card-container__company-name, h4, .base-search-card__subtitle")
                    company = comp_elem.text.strip()
                    
                    link_elem = card.find_element(By.CSS_SELECTOR, "a")
                    link = link_elem.get_attribute("href")
                    
                    jobs.append({
                        "platform": self.platform,
                        "title": title,
                        "company": company,
                        "url": link,
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                        "posted_hours": 1.0
                    })
                except: continue
                
        except Exception as e:
            logger.error("SB-LinkedIn failed: %s", e)
        finally:
            driver.quit()
            
        return jobs
