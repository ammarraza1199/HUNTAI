import logging
from typing import List, Dict, Any

from utils import deduplicator, time_parser, groq_engine, sheet
import config

logger = logging.getLogger(__name__)

def match_jobs_to_resume(resume_json: Dict[str, Any], raw_job_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Orchestrates the filtering, deduplication, AI matching, and saving flow.
    """
    if not raw_job_list:
        logger.info("No jobs to match.")
        return []
        
    logger.info("Started processing %d scraped jobs...", len(raw_job_list))
    
    # 1. Platform & Time Filtering
    # The scrapers should already apply URL filters, but we re-verify via parsing manually
    recent_jobs = time_parser.filter_recent_jobs(raw_job_list, max_hours=config.FILTER_MAX_HOURS)
    
    if not recent_jobs:
        logger.info("No jobs passed the time filter (<= %d hours).", config.FILTER_MAX_HOURS)
        return []
        
    # 2. Deduplication across platforms
    unique_jobs = deduplicator.deduplicate(recent_jobs)
    
    if not unique_jobs:
         logger.info("No new unique jobs found after deduplication.")
         return []
         
    # 3. AI Processing (Score & Match)
    analyzed_jobs = groq_engine.batch_analyze(resume_json, unique_jobs)
    
    # Sort analyzed jobs by score descending
    analyzed_jobs.sort(key=lambda x: x.get("score", 0), reverse=True)
    
    # 4. Filter out abysmal scores if necessary (optional - currently keeps all)
    
    return analyzed_jobs
    
def process_and_store(resume_json: Dict[str, Any], raw_job_list: List[Dict[str, Any]]):
    """Matches jobs and writes them to Google Sheets."""
    final_jobs = match_jobs_to_resume(resume_json, raw_job_list)
    if final_jobs:
        sheet.write_jobs(final_jobs)
    return final_jobs
