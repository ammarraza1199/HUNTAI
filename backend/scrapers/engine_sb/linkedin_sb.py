import random
import time
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone

from seleniumbase import Driver
from selenium.webdriver.common.by import By

from backend import config
from backend.utils.time_parser import parse_posted_time

logger = logging.getLogger(__name__)

class LinkedInSBScraper:
    def __init__(self):
        self.platform = "linkedin"
        self.base_url = "https://www.linkedin.com"

    def _create_search_url(self, query: str, location: str, experience_level: str = "entry") -> str:
        q = query.strip().replace(" ", "%20")
        loc = location.strip().replace(" ", "%20")
        exp = config.EXPERIENCE_CODES['linkedin'].get(experience_level.lower(), "f_E=2")
        return f"{self.base_url}/jobs/search/?{config.URL_FILTERS['linkedin']}&keywords={q}&location={loc}&{exp}"

    def scrape(self, query: str, location: str, experience_level: str = "entry", max_jobs: int = 15) -> List[Dict[str, Any]]:
        logger.info("🚀 [SB ENGINE] STARTING LINKEDIN SCRAPER for '%s' (Level: %s)", query, experience_level)
        url = self._create_search_url(query, location, experience_level)
        
        # Start browser in UC mode with Proxy Support
        driver = Driver(
            uc=True, 
            headless=config.HEADLESS,
            proxy=config.PROXY_URL if config.PROXY_URL else None
        )
        jobs = []
        
        try:
            # Session Warming via Google
            driver.get("https://www.google.com")
            time.sleep(2)
            
            # Go to LinkedIn
            logger.info("SB-LinkedIn: Navigating to %s", url)
            driver.get(url)
            # High stability wait for cloud deployments
            time.sleep(random.uniform(10, 20))
            
            selectors = config.PLATFORM_SELECTORS['linkedin']
            
            # Simple manual bypass check
            if "checkpoint/challenge" in driver.current_url or "login" in driver.current_url:
                logger.error("SB-LinkedIn: LOGIN WALL triggered. Use manual login first.")
                return []
            
            # Extract cards
            cards = driver.find_elements(By.CSS_SELECTOR, selectors['cards'])
            logger.debug("SB-LinkedIn: Found %d cards.", len(cards))
            
            for card in cards:
                if len(jobs) >= max_jobs: break
                try:
                    title_elem = card.find_element(By.CSS_SELECTOR, selectors['title'])
                    title = title_elem.text.strip()
                    
                    comp_elem = card.find_element(By.CSS_SELECTOR, selectors['company'])
                    company = comp_elem.text.strip()
                    
                    link_elem = card.find_element(By.CSS_SELECTOR, selectors['link'])
                    link = link_elem.get_attribute("href")
                    
                    # Try to extract time
                    try:
                        time_elem = card.find_element(By.CSS_SELECTOR, selectors['time'])
                        time_str = time_elem.text.strip() # e.g. "3 hours ago"
                        parsed = parse_posted_time(time_str)
                        posted_hours = parsed["hours"]
                    except:
                        posted_hours = random.uniform(1, 5)

                    # Try to extract location
                    try:
                        loc = card.find_element(By.CSS_SELECTOR, selectors['location']).text.strip()
                    except:
                        loc = "Remote"

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
            logger.error("SB-LinkedIn failed: %s", e)
        finally:
            driver.quit()
            
        return jobs
