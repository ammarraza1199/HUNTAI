import re
import math
from collections import Counter
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Standardize text for matching."""
    if not text: return ""
    # Lowercase, remove special chars
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return text

def score_job_locally(resume_data: Dict[str, Any], job: Dict[str, Any]) -> float:
    """
    Calculates a match score (0-100) using keyword frequency and weighted headers.
    No API calls required.
    """
    # 1. Prepare Content
    resume_skills = [clean_text(s) for s in resume_data.get("skills", [])]
    job_title = clean_text(job.get("title", ""))
    job_desc = clean_text(job.get("description", ""))
    
    if not job_desc and not job_title: return 0.0
    
    # 2. Extract keywords from job description
    desc_words = Counter(job_desc.split())
    title_words = set(job_title.split())
    
    score = 0
    total_weight = 0
    
    # 3. Match Skills
    for skill in resume_skills:
        skill_clean = skill.strip()
        if not skill_clean: continue
        
        weight = 10 # Base weight for a skill match
        total_weight += weight
        
        # Check in Title (High impact)
        if skill_clean in job_title:
            score += weight * 2.0 # double points for title match
        
        # Check in Description (Presence match)
        elif skill_clean in job_desc:
            # We use log frequency to avoid rewarding spamming keywords
            freq = desc_words.get(skill_clean, 0)
            score += weight * (1 + math.log10(freq)) if freq > 0 else 0
            
    # 4. Normalization
    if total_weight == 0: return 5.0 # baseline score
    
    final_score = (score / (total_weight * 1.5)) * 100
    return min(float(round(final_score, 1)), 99.0)

def rank_jobs_locally(resume_data: Dict[str, Any], jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Rank a list of jobs using the local engine."""
    for job in jobs:
        job["match_score"] = score_job_locally(resume_data, job)
    
    # Sort by score descending
    return sorted(jobs, key=lambda x: x.get("match_score", 0), reverse=True)
