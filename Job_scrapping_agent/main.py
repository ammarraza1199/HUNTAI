import argparse
import logging
import time
import sys

import config
from services import resume_parser, job_matcher
from scraper.indeed import IndeedScraper
from scraper.naukri import NaukriScraper
from scraper.linkedin import LinkedInScraper

# Setup Root Logging
if sys.platform == "win32":
    # Ensure the terminal handles emojis correctly on Windows
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

logging.basicConfig(
    level=config.LOG_LEVEL,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("main")

def main():
    parser = argparse.ArgumentParser(description="AI Job Hunter Agent")
    parser.add_argument("--resume", type=str, required=True, help="Path to your resume (PDF/DOCX)")
    parser.add_argument("--query", type=str, required=True, help="Job role / keywords (e.g. 'Python,AI ML,Fullstack')")
    parser.add_argument("--location", type=str, required=True, help="Target location (e.g. 'Hyderabad,Pune,Bangalore')")
    parser.add_argument("--platforms", type=str, help="Comma-separated platforms (e.g. indeed,naukri,linkedin). Default: all")
    parser.add_argument("--remote", action="store_true", help="Search specifically for remote jobs")
    parser.add_argument("--engine", choices=["playwright", "sb", "nd"], default="playwright", help="Scraping engine: playwright, sb, or nd")
    args = parser.parse_args()

    # Engine Selection
    logger.info("🔧 Engines: %s", args.engine.upper())
    
    if args.engine == "sb":
        from scraper_sb.naukri_sb import NaukriSBScraper
        from scraper_sb.indeed_sb import IndeedSBScraper
        from scraper_sb.linkedin_sb import LinkedInSBScraper
        n_scraper = NaukriSBScraper()
        i_scraper = IndeedSBScraper()
        l_scraper = LinkedInSBScraper()
    elif args.engine == "nd":
        from scraper_nd.naukri_nd import NaukriNDScraper
        n_scraper = NaukriNDScraper()
        i_scraper = IndeedScraper()
        l_scraper = LinkedInScraper()
    else:
        n_scraper = NaukriScraper()
        i_scraper = IndeedScraper()
        l_scraper = LinkedInScraper()

    logger.info("=" * 60)
    logger.info("🚀 STARTING AI JOB HUNTER BATCH PIPELINE")
    logger.info("=" * 60)
    
    # 0. Validate Setup
    errors = config.validate_config()
    if errors:
        logger.error("Configuration Errors found:")
        for e in errors:
            logger.error(" - %s", e)
        sys.exit(1)

    # 1. Parse Resume (Do this once)
    try:
        logger.info("📄 Parsing resume: %s", args.resume)
        resume_data = resume_parser.parse_resume(args.resume)
        logger.info("✅ Resume parsed for %s (%.1f years exp). skills count: %d", 
                    resume_data.get("name"), 
                    resume_data.get("total_years_experience", 0), 
                    len(resume_data.get("skills", [])))
    except Exception as e:
        logger.error("Failed to parse resume: %s", e)
        sys.exit(1)

    # 2. Process Queries and Locations
    queries = [q.strip() for q in args.query.split(",")]
    locations = [l.strip() for l in args.location.split(",")]
    
    platforms_to_run = ["indeed", "naukri", "linkedin"]
    if args.platforms:
        platforms_to_run = [p.strip().lower() for p in args.platforms.split(",")]

    total_scraped_across_all = 0

    for query_base in queries:
        for loc_base in locations:
            # Handle Remote context
            query = f"{query_base} Remote" if args.remote else query_base
            location = loc_base
            
            logger.info("-" * 40)
            logger.info("🔍 BATCH STEP: Searching for '%s' in '%s'", query, location)
            logger.info("-" * 40)

            all_raw_jobs = []
            
            # Scrape platforms
            if "indeed" in platforms_to_run:
                all_raw_jobs.extend(i_scraper.scrape(query, location))
                
            if "naukri" in platforms_to_run:
                if args.engine == "nd":
                    import asyncio
                    res = asyncio.run(n_scraper.scrape(query, location))
                    all_raw_jobs.extend(res)
                else:
                    all_raw_jobs.extend(n_scraper.scrape(query, location))
                
            if "linkedin" in platforms_to_run:
                all_raw_jobs.extend(l_scraper.scrape(query, location))

            logger.info("Found %d raw jobs for this step.", len(all_raw_jobs))
            total_scraped_across_all += len(all_raw_jobs)

            if all_raw_jobs:
                # 3. Match, filter, deduplicate, AI process, and store
                logger.info("🧠 Processing and AI evaluating for this batch step...")
                job_matcher.process_and_store(resume_data, all_raw_jobs)
            
            # --- COFFEE BREAK (Stealth) ---
            # Don't take a break after the very last item
            if query_base != queries[-1] or loc_base != locations[-1]:
                import random
                import time
                break_time = random.randint(120, 300) # 2 to 5 minutes
                logger.info("☕ COFFEE BREAK: Taking a human-like break for %d seconds to avoid detection...", break_time)
                time.sleep(break_time)
                
    logger.info("=" * 60)
    logger.info("✅ BATCH PIPELINE COMPLETE. Total raw jobs processed: %d", total_scraped_across_all)
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
