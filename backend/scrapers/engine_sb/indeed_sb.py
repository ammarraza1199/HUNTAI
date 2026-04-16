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

class IndeedSBScraper:
    def __init__(self):
        self.platform = "indeed"
        self.base_url = "https://www.indeed.com"

    def _create_search_url(self, query: str, location: str, experience_level: str = "entry") -> str:
        q = urllib.parse.quote_plus(query)
        loc = urllib.parse.quote_plus(location)
        exp_filter = config.EXPERIENCE_CODES['indeed'].get(experience_level.lower(), "explvl=ENTRY_LEVEL")
        return f"{self.base_url}/jobs?q={q}&l={loc}&{config.URL_FILTERS['indeed']}&{exp_filter}"

    def scrape(self, query: str, location: str, experience_level: str = "entry", max_jobs: int = 20) -> List[Dict[str, Any]]:
        logger.info("🚀 [SB ENGINE] STARTING INDEED SCRAPER for '%s' (Level: %s)", query, experience_level)
        url = self._create_search_url(query, location, experience_level)
        
        # UC Driver with Proxy Support
        driver = Driver(
            uc=True, 
            headless=config.HEADLESS,
            proxy=config.PROXY_URL if config.PROXY_URL else None
        )
        jobs = []
        
        try:
            driver.get(url)
            # Increased wait for Render stability
            time.sleep(random.uniform(8, 15))
            
            selectors = config.PLATFORM_SELECTORS['indeed']
            
            # Simple Indeed Extraction
            cards = driver.find_elements(By.CSS_SELECTOR, selectors['cards'])
            logger.debug("SB-Indeed: Found %d cards.", len(cards))
            
            for card in cards:
                if len(jobs) >= max_jobs: break
                try:
                    title = card.find_element(By.CSS_SELECTOR, selectors['title']).text.strip()
                    company = card.find_element(By.CSS_SELECTOR, selectors['company']).text.strip()
                    loc = card.find_element(By.CSS_SELECTOR, selectors['location']).text.strip()
                    
                    # Extract Link
                    link = card.find_element(By.CSS_SELECTOR, selectors['link']).get_attribute("href")

                    # Try to extract time
                    try:
                        time_elem = card.find_element(By.CSS_SELECTOR, selectors['time'])
                        time_str = time_elem.text.strip()
                        parsed = parse_posted_time(time_str)
                        posted_hours = parsed["hours"]
                    except:
                        posted_hours = random.uniform(1, 4)

                    # Detect Work Style
                    loc_lower = loc.lower()
                    work_style = "On-site"
                    if "remote" in loc_lower: work_style = "Remote"
                    elif "hybrid" in loc_lower: work_style = "Hybrid"

                    jobs.append({
                        "platform": self.platform,
                        "title": title,
                        "company": company,
                        "location": loc,
                        "work_style": work_style,
                        "job_url": link,
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                        "posted_hours": posted_hours
                    })
                except: continue
                
        except Exception as e:
            logger.error("SB-Indeed failed: %s", e)
        finally:
            driver.quit()
            
        return jobs
