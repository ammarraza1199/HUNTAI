import asyncio
import random
import time
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone
from backend import config
from backend.utils.time_parser import parse_posted_time

import nodriver as uc

logger = logging.getLogger(__name__)

class NaukriNDScraper:
    """
    Scraper for Naukri using Nodriver.
    Nodriver uses CDP (Chrome DevTools Protocol) directly, completely bypassing Webdriver protocols.
    """
    def __init__(self):
        self.platform = "naukri"
        self.base_url = config.NAUKRI_BASE_URL
        
    def _create_search_url(self, query: str, location: str) -> str:
        query_formatted = query.strip().replace(" ", "-").lower()
        loc_formatted = location.strip().replace(" ", "-").lower()
        url = f"{self.base_url}/{query_formatted}-jobs-in-{loc_formatted}?{config.URL_FILTERS['naukri']}"
        return url

    async def scrape(self, query: str, location: str, max_jobs: int = config.MAX_JOBS_PER_PLATFORM) -> List[Dict[str, Any]]:
        logger.info("🚀 [NODRIVER ENGINE] STARTING NAUKRI SCRAPER for '%s'", query)
        url = self._create_search_url(query, location)
        
        # Start browser
        browser = await uc.start()
        jobs = []
        
        try:
            # 1. Session Warming via Google
            page = await browser.get("https://www.google.com")
            await page.wait_for("input", timeout=10) # Wait for search box to show it's loaded
            await asyncio.sleep(random.uniform(2, 4))
            
            # 2. Main Search
            logger.info("ND-Naukri: Navigating to %s", url)
            page = await browser.get(url)
            await asyncio.sleep(random.uniform(5, 8))
            
            # 3. Detect Block
            content = await page.get_content()
            content = content.lower()
            if "access denied" in content or "robot" in content:
                logger.error("ND-Naukri: Access Denied. Trying a forced reload...")
                await page.reload()
                await asyncio.sleep(10)
                if "access denied" in (await page.get_content()).lower():
                    logger.error("ND-Naukri: Still blocked. Stealth failing.")
                    return []

            # 4. Extract (Custom selector logic)
            # Find job cards using CSS
            cards = await page.find_all("div.srp-jobtuple-wrapper, article.jobTuple")
            logger.debug("ND-Naukri: Found %d cards.", len(cards))
            
            seen_identifiers = set()
            for card in cards:
                if len(jobs) >= max_jobs:
                    break
                    
                try:
                    title_elem = await card.find("a.title")
                    title = title_elem.text.strip()
                    job_url = title_elem.attributes.get("href", "")
                    
                    company_elem = await card.find("a.comp-name")
                    company = company_elem.text.strip()
                    
                    loc_elem = await card.find(".locWdth")
                    loc = loc_elem.text.strip()
                    
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
                except:
                    continue
                    
        except Exception as e:
            logger.error("ND-Naukri failure: %s", e)
        finally:
            await browser.stop()
            
        return jobs
