import os
import signal
import psutil
import logging

logger = logging.getLogger(__name__)

def cleanup_chrome_processes():
    """
    Kills any lingering chrome or chromedriver processes to free up RAM.
    Essential for restricted environments like Render Free Tier.
    """
    logger.info("🧹 [SANITIZER] Running process cleanup...")
    
    target_names = ['chrome', 'chromedriver', 'google-chrome']
    killed_count = 0
    
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            name = proc.info['name'].lower()
            if any(target in name for target in target_names):
                proc.kill()
                killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
            
    if killed_count > 0:
        logger.info(f"✅ [SANITIZER] Cleaned up {killed_count} lingering processes.")
    else:
        logger.debug("✨ [SANITIZER] System already clean.")
