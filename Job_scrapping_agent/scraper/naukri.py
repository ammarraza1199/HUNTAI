import random
import time
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright, Page, Locator

import config
from utils.time_parser import parse_posted_time
from utils.fingerprint_spoofer import apply_stealth, set_realistic_headers, random_user_agent
from utils.retry_handler import retry_call

logger = logging.getLogger(__name__)

class NaukriScraper:
    """
    Scraper for Naukri (React SPA).
    Exclusively using Playwright, handling infinite scroll, unstable selectors, and IP blocking.
    """
    def __init__(self):
        self.platform = "naukri"
        self.base_url = config.NAUKRI_BASE_URL
        
    def _create_search_url(self, query: str, location: str) -> str:
        # Example Naukri search URL format: https://www.naukri.com/python-developer-jobs-in-hyderabad?jobAge=1
        query_formatted = query.strip().replace(" ", "-").lower()
        loc_formatted = location.strip().replace(" ", "-").lower()
        url = f"{self.base_url}/{query_formatted}-jobs-in-{loc_formatted}?{config.URL_FILTERS['naukri']}"
        return url

    def scrape(self, query: str, location: str, max_jobs: int = config.MAX_JOBS_PER_PLATFORM) -> List[Dict[str, Any]]:
        logger.info("STARTING NAUKRI SCRAPER for '%s' in '%s'", query, location)
        url = self._create_search_url(query, location)
        
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
            
            # Substantial stealth
            apply_stealth(page)

            jobs = []
            try:
                # --- SESSION WARMING (Stealth 2.0) ---
                warmup_sites = ["https://www.google.com", "https://www.bing.com"]
                warmup_url = random.choice(warmup_sites)
                logger.debug("Naukri: Warming up session via %s", warmup_url)
                page.goto(warmup_url, wait_until="domcontentloaded")
                time.sleep(random.uniform(2, 5))

                logger.info("Navigating to %s", url)
                page.goto(url, wait_until="domcontentloaded", timeout=config.NAVIGATION_TIMEOUT)
                
                # Check for blocking or empty results
                if self._check_blocked(page):
                    logger.warning("Naukri appears to be blocked or returned zero results. Returning empty list.")
                    return []
                    
                jobs = self._scroll_to_load(page, max_jobs)
                
            except Exception as e:
                logger.error("Naukri scraping failed: %s", e)
            finally:
                context.close()
                browser.close()
                
            return jobs

    def _check_blocked(self, page: Page) -> bool:
        """Determine if Naukri blocked the request or returned 0 results."""
        try:
            # Wait a moment for React to render initial shell
            page.wait_for_timeout(3000)
            
            # Check for error pages or 0 results text
            # Fallbacks: text based on 'No results' or specific error selectors
            content = page.content().lower()
            if "access denied" in content or "robot" in content:
                logger.error("Naukri: Access Denied / Bot detection tripped.")
                return True
                
            # Wait for job container to appear
            try:
                # Naukri jobs are typically in dynamic classes but nested in article or div.list
                # Let's wait for list container
                page.wait_for_selector("div.list, div.srp-jobtuple-wrapper, article.jobTuple", timeout=10000)
                articles = page.locator("div.srp-jobtuple-wrapper, article.jobTuple").count()
                if articles == 0:
                     logger.warning("Naukri: Page loaded but 0 job articles found.")
                     # Retry once by reloading
                     page.reload(wait_until="domcontentloaded")
                     page.wait_for_timeout(3000)
                     articles = page.locator("div.srp-jobtuple-wrapper, article.jobTuple").count()
                     if articles == 0:
                         return True
                return False
            except Exception:
                logger.warning("Naukri: Could not find job container selectors on page.")
                return True
                
        except Exception as e:
            logger.error("Error checking Naukri block status: %s", e)
            return True

    def _scroll_to_load(self, page: Page, max_jobs: int) -> List[Dict[str, Any]]:
        jobs = []
        consecutive_no_new_jobs = 0
        seen_identifiers = set()
        
        for scroll_attempt in range(config.MAX_SCROLL_ATTEMPTS):
            # Target structural selectors wrapper
            locators = page.locator("div.srp-jobtuple-wrapper, article.jobTuple")
            count = locators.count()
            
            new_jobs_in_scroll = 0
            
            for i in range(count):
                if len(jobs) >= max_jobs:
                    logger.info("Naukri: Reached max_jobs limit (%d).", max_jobs)
                    return jobs
                    
                card = locators.nth(i)
                job_data = self._extract_job_card(card)
                
                # Use title+company as basic ID before formal hashing
                iden = f"{job_data.get('title')}|{job_data.get('company')}"
                if job_data.get("title") and iden not in seen_identifiers:
                    jobs.append(job_data)
                    seen_identifiers.add(iden)
                    new_jobs_in_scroll += 1
            
            if new_jobs_in_scroll == 0:
                consecutive_no_new_jobs += 1
                if consecutive_no_new_jobs >= 3:
                     logger.info("Naukri: 3 consecutive scrolls without new jobs. Stopping.")
                     break
            else:
                consecutive_no_new_jobs = 0
                
            # Scroll down
            scroll_amount = random.randint(config.SCROLL_INCREMENT_MIN, config.SCROLL_INCREMENT_MAX)
            page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            
            # Wait for dynamic load
            time.sleep(random.uniform(config.SCROLL_DELAY_MIN, config.SCROLL_DELAY_MAX))
            
            # Specific wait for network idle to ensure new content is fetched
            page.wait_for_load_state("networkidle", timeout=5000)

        return jobs

    def _extract_job_card(self, card: Locator) -> Dict[str, Any]:
        """Wrap each extraction in try/except for resilience."""
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
        
        try:
            # Title & URL
            title_node = card.locator("a.title")
            if title_node.count() > 0:
                data["title"] = title_node.first.inner_text().strip()
                data["url"] = title_node.first.get_attribute("href") or ""
        except Exception:
            pass

        try:
            # Company
            company_node = card.locator("a.comp-name")
            if company_node.count() > 0:
                data["company"] = company_node.first.inner_text().strip()
        except Exception:
            pass

        try:
            # Location
            loc_node = card.locator("span.locWdth, li.location")
            if loc_node.count() > 0:
                data["location"] = loc_node.first.inner_text().strip()
        except Exception:
            pass

        try:
            # Salary
            sal_node = card.locator("span.sal, li.salary")
            if sal_node.count() > 0:
                data["salary"] = sal_node.first.inner_text().strip()
        except Exception:
            pass

        try:
            # Timestamp (critical)
            time_node = card.locator("span.job-post-day, span.jobAge")
            if time_node.count() > 0:
                raw_time = time_node.first.inner_text().strip()
                parsed = parse_posted_time(raw_time)
                data["posted_raw"] = parsed["raw"]
                data["posted_hours"] = parsed["hours"]
                data["posted_utc"] = parsed["abs_utc"]
        except Exception:
            data["posted_raw"] = "unknown"
            
        try:
            # Summary / Description
            desc_node = card.locator("div.job-desc, span.job-description")
            if desc_node.count() > 0:
                data["description"] = desc_node.first.inner_text().strip()
        except Exception:
            pass

        return data
