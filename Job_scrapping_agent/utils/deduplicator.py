import hashlib
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def generate_job_hash(title: str, company: str) -> str:
    """Generate a unique SHA-256 hash based on normalized title and company."""
    title_norm = str(title).strip().lower()
    company_norm = str(company).strip().lower()
    content = f"{title_norm}|{company_norm}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def deduplicate(job_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicates from a list of jobs based on the title + company hash.
    Also injects the `job_id` property into each job dictionary if not present.
    """
    unique_jobs = []
    seen_hashes = set()
    
    for job in job_list:
        title = job.get('title', '')
        company = job.get('company', '')
        
        job_hash = generate_job_hash(title, company)
        job['job_id'] = job_hash
        
        if job_hash not in seen_hashes:
            seen_hashes.add(job_hash)
            unique_jobs.append(job)
        else:
            logger.debug("Filtered out duplicate job: %s at %s", title, company)
            
    logger.info("Deduplication: Reduced from %d to %d jobs.", len(job_list), len(unique_jobs))
    return unique_jobs
