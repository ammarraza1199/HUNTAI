"""
config.py — Central Configuration for AI Job Hunter Agent
All secrets via .env, all tunable constants here. Never hardcode secrets.
"""

import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# ─── Load .env ────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

# ─── API Keys & Credentials (Defaults, BYOK override in pipeline) ──────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEY_SCORING: str = os.getenv("GROQ_API_KEY_SCORING", GROQ_API_KEY)
GROQ_API_KEY_COVER_LETTER: str = os.getenv("GROQ_API_KEY_COVER_LETTER", GROQ_API_KEY)

# ─── Groq Model ───────────────────────────────────────────────────────────────
GROQ_MODEL: str = "llama-3.1-8b-instant"
GROQ_MODEL_SCORING: str = "llama-3.1-8b-instant"
GROQ_MODEL_COVER_LETTER: str = "llama-3.3-70b-versatile"
GROQ_MAX_TOKENS: int = 4096
GROQ_TEMPERATURE: float = 0.3
GROQ_RETRY_ATTEMPTS: int = 3
GROQ_RETRY_BACKOFF: list = [5, 10, 20]   
COVER_LETTER_THRESHOLD: int = 75         
BATCH_SIZE_SCORING: int = 5              

# ─── Scraping Limits ──────────────────────────────────────────────────────────
PROXY_URL: str = os.getenv("PROXY_URL", "")

MAX_JOBS_PER_PLATFORM: int = 20       # Adjusted to 20 per user requests
MAX_JOBS_LINKEDIN: int = 20           
MAX_SCROLL_ATTEMPTS: int = 15
MAX_PAGES_INDEED: int = 5

# ─── Timing & Delays (Relaxed for stealth) ───────────────────────────────────
DELAY_MIN: float = 3.0                
DELAY_MAX: float = 8.0                
SCROLL_DELAY_MIN: float = 2.0
SCROLL_DELAY_MAX: float = 5.0
SCROLL_INCREMENT_MIN: int = 200       
SCROLL_INCREMENT_MAX: int = 600       
LINKEDIN_COOLDOWN_SECONDS: int = 1800 

# ─── Time Filtering ───────────────────────────────────────────────────────────
FILTER_MAX_HOURS: int = 24            
FILTER_PREFER_HOURS: int = 12         

# ─── Retry ────────────────────────────────────────────────────────────────────
RETRY_ATTEMPTS: int = 3
RETRY_BACKOFF: list = [2, 4, 8]       

URL_FILTERS = {
    "indeed": "fromage=1",
    "naukri": "jobAge=1",
    "linkedin": "f_TPR=r86400",
}

# Mapping of UI levels to platform-specific URL parameters
EXPERIENCE_CODES = {
    "linkedin": {
        "entry": "f_E=2%2Cf_E=1", # Internship + Entry
        "mid": "f_E=3%2Cf_E=4",   # Associate + Mid-Senior
        "senior": "f_E=5%2Cf_E=6" # Director + Executive
    },
    "naukri": {
        "entry": "experience=0",
        "mid": "experience=3",
        "senior": "experience=8"
    },
    "indeed": {
        "entry": "explvl=ENTRY_LEVEL",
        "mid": "explvl=MID_LEVEL",
        "senior": "explvl=SENIOR_LEVEL"
    }
}

# ─── Session / Cookie Storage ─────────────────────────────────────────────────
SESSION_DIR: Path = BASE_DIR / "sessions"
SESSION_DIR.mkdir(exist_ok=True)
LINKEDIN_SESSION_FILE: Path = SESSION_DIR / "linkedin_session.json"
SESSION_MAX_AGE_HOURS: int = 12       

# ─── Cache & Exports ──────────────────────────────────────────────────────────
CACHE_DIR: Path = BASE_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)
CACHE_FILE: Path = CACHE_DIR / "processed_jobs.json"

EXPORTS_DIR: Path = BASE_DIR / "exports"
EXPORTS_DIR.mkdir(exist_ok=True)

# ─── Logs ─────────────────────────────────────────────────────────────────────
LOG_DIR: Path = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE: Path = LOG_DIR / "job_agent.log"
LOG_LEVEL: int = logging.INFO

# ─── Browser ──────────────────────────────────────────────────────────────────
HEADLESS: bool = True                 
BROWSER_TIMEOUT: int = 30_000        
NAVIGATION_TIMEOUT: int = 60_000     

# ─── Platform Base URLs ───────────────────────────────────────────────────────
INDEED_BASE_URL: str = "https://www.indeed.com"
NAUKRI_BASE_URL: str = "https://www.naukri.com"
LINKEDIN_BASE_URL: str = "https://www.linkedin.com"

# ─── Modular CSS Selectors (For easier maintenance) ───────────────────────────
PLATFORM_SELECTORS = {
    "linkedin": {
        "cards": ".job-card-container, .base-card, .base-search-card",
        "title": ".job-card-list__title, h3, .base-search-card__title",
        "company": ".job-card-container__company-name, h4, .base-search-card__subtitle",
        "link": "a",
        "time": "time, .job-search-card__listdate",
        "location": ".job-search-card__location"
    },
    "indeed": {
        "cards": ".job_seen_atlas, .result, .uoc-Card",
        "title": "h2.jobTitle",
        "company": "[data-testid='company-name']",
        "location": "[data-testid='text-location']",
        "link": "a.jcs-JobTitle",
        "time": ".date, .date-posted"
    },
    "naukri": {
        "cards": "div.srp-jobtuple-wrapper, article.jobTuple",
        "title": "a.title",
        "company": "a.comp-name",
        "location": ".locWdth",
        "time": ".job-post-day, .posted-day"
    }
}

# ─── Validation ───────────────────────────────────────────────────────────────
def validate_config() -> list[str]:
    """
    Validate required configuration values.
    Returns a list of missing/invalid config keys.
    """
    errors: list[str] = []
    # No longer enforcing GROQ API key here if users bring their own!
    return errors
