import random
import time
import logging
import urllib.parse
from typing import List, Dict, Any
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright, Page, Locator

from backend import config
from backend.utils import cookie_manager
from backend.utils.time_parser import parse_posted_time
from backend.utils.fingerprint_spoofer import apply_stealth, set_realistic_headers, random_user_agent

logger = logging.getLogger(__name__)

class LinkedInScraper:
    """
    Scraper for LinkedIn.
    Handles strict bot protection, login walls via session reuse, pagination, and DOM variations.
    """
    def __init__(self):
        self.platform = "linkedin"
        self.base_url = config.LINKEDIN_BASE_URL
        
    def _create_search_url(self, query: str, location: str) -> str:
        # Example LinkedIn URL: https://www.linkedin.com/jobs/search/?f_TPR=r86400&keywords=python%20developer&location=hyderabad
        q = urllib.parse.quote_plus(query)
        loc = urllib.parse.quote_plus(location)
        url = f"{self.base_url}/jobs/search/?{config.URL_FILTERS['linkedin']}&keywords={q}&location={loc}"
        return url

    def scrape(self, query: str, location: str, max_jobs: int = config.MAX_JOBS_LINKEDIN) -> List[Dict[str, Any]]:
        # Hard cap for LinkedIn to avoid bans
        max_jobs = min(max_jobs, config.MAX_JOBS_LINKEDIN)
        logger.info("STARTING LINKEDIN SCRAPER for '%s' in '%s'. Limit: %d jobs.", query, location, max_jobs)
        
        # Check login state
        if not cookie_manager.is_session_valid(self.platform):
            login_url = f"{self.base_url}/login"
            cookie_manager.prompt_manual_login(self.platform, login_url)
            
        session_file = cookie_manager.load_cookies(self.platform)
        if not session_file:
            logger.error("LinkedIn: Valid session required. Skipping scrape.")
            return []

        jobs = []
        url = self._create_search_url(query, location)
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=config.HEADLESS,
                    channel="chrome", # Run real Chrome to evade detection
                    args=[
                        "--disable-blink-features=AutomationControlled",
                        "--no-sandbox",
                        "--disable-dev-shm-usage"
                    ]
                )
                
                context = browser.new_context(
                    viewport={"width": random.randint(1366, 1920), "height": random.randint(768, 1080)},
                    user_agent=random_user_agent(),
                    java_script_enabled=True,
                    storage_state=session_file # Inject saved cookies!
                )
                
                set_realistic_headers(context)
                page = context.new_page()
                apply_stealth(page)

                # --- SESSION WARMING (Stealth 2.0) ---
                warmup_sites = ["https://www.google.com", "https://www.bing.com"]
                warmup_url = random.choice(warmup_sites)
                logger.debug("LinkedIn: Warming up session via %s", warmup_url)
                page.goto(warmup_url, wait_until="domcontentloaded")
                time.sleep(random.uniform(2, 5))
                
                logger.info("LinkedIn: Navigating to %s", url)
                page.goto(url, wait_until="domcontentloaded", timeout=config.NAVIGATION_TIMEOUT)
                
                # Verify we aren't blocked or logged out
                if self._detect_blocking(page):
                     logger.warning("LinkedIn: Blocked or session expired. Aborting.")
                     return []
                     
                jobs = self._scroll_jobs_page(page, max_jobs)
                
        except Exception as e:
            logger.error("LinkedIn scraping failed: %s", e)
            
        return jobs

    def _detect_blocking(self, page: Page) -> bool:
        """Check for common LinkedIn blocking screens."""
        try:
            page.wait_for_timeout(3000)
            target_url = page.url.lower()
            
            # Did it redirect to login?
            if "linkedin.com/login" in target_url or "checkpoint/challenge" in target_url:
                logger.error("LinkedIn: Redirected to login/checkpoint. Session likely expired or challenged.")
                return True
                
            content = page.content().lower()
            if "unusual activity" in content or "please verify you are a human" in content:
                logger.error("LinkedIn: Bot detection CAPTCHA triggered.")
                return True
                
            # Wait for job listings container
            try:
                page.wait_for_selector(".scaffold-layout__list, .jobs-search-results-list", timeout=10000)
                return False
            except Exception:
                # If jobs list doesn't appear, check if there are 0 results specifically indicated
                if "no matching jobs found" in content:
                     logger.info("LinkedIn: Valid page, but 0 matching results found.")
                     return False
                logger.warning("LinkedIn: Job list container not found. DOM changed or blocked.")
                return True
                
        except Exception:
            return True

    def _scroll_jobs_page(self, page: Page, max_jobs: int) -> List[Dict[str, Any]]:
        jobs = []
        consecutive_no_new_jobs = 0
        seen_identifiers = set()
        
        # In the modern layout, jobs are in a scrollable list container on the left
        list_selector = ".jobs-search-results-list"
        
        for scroll_attempt in range(config.MAX_SCROLL_ATTEMPTS):
            try:
                card_locators = page.locator(".job-card-container, [data-job-id]")
                count = card_locators.count()
            except Exception as e:
                logger.error("LinkedIn: Error counting job cards: %s", e)
                break
                
            new_jobs = 0
            
            for i in range(count):
                if len(jobs) >= max_jobs:
                    logger.info("LinkedIn: Reached max_jobs limit (%d).", max_jobs)
                    return jobs
                    
                card = card_locators.nth(i)
                job_data = self._extract_job_card(card)
                
                iden = f"{job_data.get('title')}|{job_data.get('company')}"
                if job_data.get("title") and iden not in seen_identifiers:
                    jobs.append(job_data)
                    seen_identifiers.add(iden)
                    new_jobs += 1
                    
            if new_jobs == 0:
                consecutive_no_new_jobs += 1
                if consecutive_no_new_jobs >= 3:
                     logger.info("LinkedIn: No new jobs after 3 scrolls. Stopping.")
                     break
            else:
                consecutive_no_new_jobs = 0

            # 1. Sim Human Behavior: Random Mouse Jitter
            try:
                for _ in range(random.randint(2, 5)):
                    page.mouse.move(random.randint(100, 700), random.randint(100, 700))
                    time.sleep(random.uniform(0.2, 0.5))
            except:
                pass

            # 2. Relaxed Scroll
            try:
                # LinkedIn has two main layouts for search: side-by-side or full-width
                # 1. scaffold-layout__list (Side-by-side)
                # 2. jobs-search-results-list (older)
                # 3. Fallback to direct window scroll
                scroll_amount = random.randint(config.SCROLL_INCREMENT_MIN, config.SCROLL_INCREMENT_MAX)
                page.evaluate(f"""
                    (amount) => {{
                        const list = document.querySelector('.scaffold-layout__list, .jobs-search-results-list, .jobs-search-results-list__container');
                        if (list) {{
                            list.scrollBy(0, amount);
                        }} else {{
                            window.scrollBy(0, amount);
                        }}
                    }}
                """, scroll_amount)
                
                time.sleep(random.uniform(config.SCROLL_DELAY_MIN, config.SCROLL_DELAY_MAX))
                page.wait_for_timeout(2000) # Wait for network/DOM update
            except Exception as js_err:
                logger.warning("LinkedIn: Error scrolling: %s", js_err)
                # Don't break immediately, give it another chance if it didn't find cards

        return jobs

    def _extract_job_card(self, card: Locator) -> Dict[str, Any]:
        """Highly resilient extraction using semantic/structural and aria selectors where possible."""
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
        
        # Title (Primary: [aria-label] attributes, Fallback class names)
        try:
            title_node = card.locator(".job-card-container__link, .job-card-list__title, strong")
            if title_node.count() > 0:
                data["title"] = title_node.first.inner_text().strip()
                href = title_node.first.get_attribute("href")
                if href:
                    data["url"] = self.base_url + href if href.startswith('/') else href
        except Exception:
            pass

        # Company
        try:
            comp_node = card.locator(".job-card-container__company-name, .artdeco-entity-lockup__subtitle")
            if comp_node.count() > 0:
                data["company"] = comp_node.first.inner_text().strip()
        except Exception:
            pass

        # Location
        try:
            loc_node = card.locator(".job-card-container__metadata-item, .job-card-container__metadata-wrapper li")
            if loc_node.count() > 0:
                data["location"] = loc_node.first.inner_text().strip()
        except Exception:
            pass

        # Timestamp
        try:
            # Look for typical time strings via XPath text matching as a strong fallback
            time_node = card.locator("time, span[text()*='ago'], dl dd")
            if time_node.count() > 0:
                raw_time = time_node.first.inner_text().strip()
                # Use raw_time only if it looks like a time string, sometimes it picks up location if selectors overlap
                if any(x in raw_time.lower() for x in ["ago", "just", "now", "hour", "day"]):
                    parsed = parse_posted_time(raw_time)
                    data["posted_raw"] = parsed["raw"]
                    data["posted_hours"] = parsed["hours"]
                    data["posted_utc"] = parsed["abs_utc"]
            
            # If still inf, try to find a job-card-container__listed-time class
            if data["posted_hours"] == float("inf"):
                 alt_time = card.locator(".job-card-container__listed-time, .job-search-card__listdate")
                 if alt_time.count() > 0:
                     parsed = parse_posted_time(alt_time.first.inner_text().strip())
                     data["posted_raw"] = parsed["raw"]
                     data["posted_hours"] = parsed["hours"]
                     data["posted_utc"] = parsed["abs_utc"]
        except Exception:
            data["posted_raw"] = "unknown"

        return data
