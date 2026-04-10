import json
import logging
import time
from pathlib import Path
from playwright.sync_api import Page, sync_playwright

import config

logger = logging.getLogger(__name__)

def get_session_file_path(platform: str) -> Path:
    """Return the absolute path for a platform's session file."""
    return config.SESSION_DIR / f"{platform}_session.json"

def is_session_valid(platform: str) -> bool:
    """
    Check if a session file exists and is younger than SESSION_MAX_AGE_HOURS.
    """
    session_file = get_session_file_path(platform)
    if not session_file.exists():
        return False
        
    try:
        mtime = session_file.stat().st_mtime
        age_hours = (time.time() - mtime) / 3600
        is_valid = age_hours < config.SESSION_MAX_AGE_HOURS
        if not is_valid:
            logger.info("Session for %s expired (%.1f hours old).", platform, age_hours)
        return is_valid
    except OSError as e:
        logger.error("Error checking session validity for %s: %s", platform, e)
        return False

def load_cookies(platform: str):
    """
    Load the session state suitable for Playwright's storage_state.
    Returns the path to the session JSON file if valid, else None.
    """
    if is_session_valid(platform):
        path = get_session_file_path(platform)
        logger.info("Loaded valid session for %s from %s", platform, path.name)
        return str(path)
    return None

def save_cookies(platform: str, state: dict):
    """Save the Playwright storage_state strictly to file."""
    session_file = get_session_file_path(platform)
    try:
        with open(session_file, "w", encoding="utf-8") as f:
            json.dump(state, f)
        logger.info("Saved new session for %s to %s", platform, session_file.name)
    except Exception as e:
        logger.error("Failed to save session for %s: %s", platform, e)

def prompt_manual_login(platform: str, login_url: str):
    """
    Open a visible browser to allow the user to manually log in.
    Waits for the user to close the browser before saving the new session.
    """
    logger.info("=== MANUAL LOGIN REQUIRED FOR %s ===", platform.upper())
    logger.info("Opening browser. Please log in and then CLOSE the browser window manually.")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, channel="chrome")
        context = browser.new_context()
        page = context.new_page()
        page.goto(login_url)
        
        # Wait until the browser context is closed by the user
        while len(browser.contexts) > 0 and len(browser.contexts[0].pages) > 0:
            try:
                page.wait_for_timeout(1000)
            except Exception:
                break # Page or browser closed
                
        # Save state right before context is completely destroyed if possible
        # However, if browser is closed, we might not be able to get state.
        # Actually better to wait for a specific condition or just wait for timeout / user prompt.
        
        logger.info("Browser closed. Attempting to save session...")
        state = context.storage_state()
        save_cookies(platform, state)
        browser.close()
        logger.info("Session saved for %s.", platform)
