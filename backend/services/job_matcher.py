import logging
from typing import List, Dict, Any

from backend.utils import deduplicator, time_parser, groq_engine
from backend.utils.local_scorer import rank_jobs_locally
from backend import config

logger = logging.getLogger(__name__)

def match_jobs_to_resume(resume_json: Dict[str, Any], raw_job_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Orchestrates the hybrid matching flow:
    1. Filter & Deduplicate.
    2. Local Semantic Ranking (Unlimited/Free).
    3. AI Deep Analysis (Groq - Top 15 only).
    """
    if not raw_job_list:
        logger.info("No jobs to match.")
        return []
        
    logger.info("Started processing %d scraped jobs...", len(raw_job_list))
    
    # 1. Platform & Time Filtering
    recent_jobs = time_parser.filter_recent_jobs(raw_job_list, max_hours=config.FILTER_MAX_HOURS)
    
    if not recent_jobs:
        logger.info("No jobs passed the time filter.")
        return []
        
    # 2. Deduplication across platforms
    unique_jobs = deduplicator.deduplicate(recent_jobs)
    
    if not unique_jobs:
         logger.info("No new unique jobs found after deduplication.")
         return []
         
    # 3. Local Tier-1 Filter (Extremely fast, zero API cost)
    logger.info("📊 Running Local Ranking Engine on %d jobs...", len(unique_jobs))
    locally_ranked = rank_jobs_locally(resume_json, unique_jobs)
    
    # 4. Premium AI Analysis (Phase 2 - Top 15 Only)
    # This prevents hitting Groq rate limits with too many low-quality jobs.
    top_tier_limit = 15
    top_for_ai = locally_ranked[:top_tier_limit]
    remaining_jobs = locally_ranked[top_tier_limit:]
    
    logger.info("🧠 Sending Top %d jobs for Premium AI Analysis (Groq)...", len(top_for_ai))
    analyzed_top = groq_engine.batch_analyze(resume_json, top_for_ai)
    
    # 5. Generate cover letters for the absolute best (Top 5)
    # The batch_analyze already handles cover letters internally based on threshold,
    # but we ensure the ranking is maintained.
    
    all_final_jobs = analyzed_top + remaining_jobs
    
    # Final Sort by match_score (AI score for top, Local score for rest)
    all_final_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    return all_final_jobs
    
