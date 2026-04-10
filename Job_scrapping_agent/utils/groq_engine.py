import json
import logging
import time
from typing import Dict, Any, List, Optional

import groq
from groq import Groq

import config
from utils.retry_handler import retry_call

logger = logging.getLogger(__name__)

# Initialize clients lazily
_clients = {}

def get_client(purpose: str = "scoring") -> Groq:
    """Gets a Groq client for a specific purpose, potentially using a different API key."""
    global _clients
    # Map purpose to the correct key from config
    if purpose == "scoring":
        api_key = config.GROQ_API_KEY_SCORING
    elif purpose == "cover_letter":
        api_key = config.GROQ_API_KEY_COVER_LETTER
    else:
        api_key = config.GROQ_API_KEY

    if api_key not in _clients:
        if not api_key:
            # Fallback to base key if specific one is missing
            if not config.GROQ_API_KEY:
                raise ValueError(f"Groq API key for {purpose} not found in config/env")
            api_key = config.GROQ_API_KEY
            
        _clients[api_key] = Groq(api_key=api_key)
    return _clients[api_key]

def score_jobs_batch(resume_json: Dict[str, Any], jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Score a batch of jobs (e.g., 5) in a single LLM call.
    Returns a list of dicts with scoring keys.
    """
    client = get_client("scoring")
    
    system_prompt = (
        "You are an expert technical recruiter. Analyze the user's resume against a list of job descriptions. "
        "For EACH job, calculate a match score (0-100) based on skills and experience, and identify missing skills. "
        "Return the output STRICTLY as a JSON object with a key 'results' which is a list matching the input order.\n"
        "Each result should have:\n"
        "- \"score\": Integer (0-100).\n"
        "- \"missing_skills\": List of strings showing technical skills required but absent.\n"
        "- \"suggestions\": List of strings (max 2) for resume adjustment."
    )
    
    # We send minimal job data to save tokens
    user_content = json.dumps({
        "resume_skills": resume_json.get("skills", []),
        "resume_experience": resume_json.get("experience", []),
        "jobs": [
            {
                "id": i, 
                "title": j.get("title"), 
                "company": j.get("company"), 
                "description": (j.get("description", "")[:1500] + "...") if len(j.get("description", "")) > 1500 else j.get("description")
            }
            for i, j in enumerate(jobs)
        ]
    })

    def _call_groq():
        response = client.chat.completions.create(
            model=config.GROQ_MODEL_SCORING,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        return data.get("results", [])

    try:
        results = retry_call(
            _call_groq,
            attempts=config.GROQ_RETRY_ATTEMPTS,
            backoff=config.GROQ_RETRY_BACKOFF,
            exceptions=(Exception,)
        )
        # Ensure we return a list of the same length as jobs
        if not results or not isinstance(results, list):
             return [{"score": 0, "missing_skills": [], "suggestions": ["API formatting error"]} for _ in jobs]
        
        # Pad or truncate to match input size just in case the LLM hallucinated the list size
        if len(results) < len(jobs):
            results.extend([{"score": 0, "missing_skills": [], "suggestions": []} for _ in range(len(jobs) - len(results))])
        return results[:len(jobs)]
        
    except Exception as e:
        logger.error("Batch scoring failed: %s", e)
        return [{"score": 0, "missing_skills": [], "suggestions": ["Error in batch processing"]} for _ in jobs]

def generate_premium_cover_letter(resume_json: Dict[str, Any], job_post: Dict[str, Any]) -> str:
    """
    Generate a high-quality cover letter using the smarter model (e.g., Llama 70b).
    """
    client = get_client("cover_letter")
    
    system_prompt = (
        "You are a professional career coach. Write a highly tailored, persuasive, and professional "
        "cover letter (2-3 paragraphs) for the following job using the provided resume. "
        "Highlight the candidate's core strengths that align with the job description. "
        "Keep it concise but impactful. Return ONLY the text of the cover letter."
    )
    
    job_data_short = {
        "title": job_post.get("title"),
        "company": job_post.get("company"),
        "description": job_post.get("description", "")[:2000]
    }

    def _call_groq():
        response = client.chat.completions.create(
            model=config.GROQ_MODEL_COVER_LETTER,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Resume: {json.dumps(resume_json)}\n\nJob: {json.dumps(job_data_short)}"}
            ],
            temperature=0.4,
            max_tokens=2048
        )
        return response.choices[0].message.content.strip()

    try:
        return retry_call(_call_groq, attempts=2, backoff=[5, 10])
    except Exception as e:
        logger.error("Premium cover letter generation failed for %s: %s", job_post.get("title"), e)
        return "Failed to generate cover letter."

def batch_analyze(resume_json: Dict[str, Any], job_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Smart-tier analysis:
    1. Batch score jobs in chunks (multi-jobs per call) to save RPM/TPM.
    2. Regenerate cover letters ONLY for jobs matching the threshold using the heavy model.
    """
    total_jobs = len(job_list)
    if total_jobs == 0:
        return job_list
        
    logger.info("🚀 Starting AI-Tiered analysis on %d jobs...", total_jobs)
    
    # Initialize fields
    for job in job_list:
        job["score"] = 0
        job["missing_skills"] = []
        job["suggestions"] = []
        job["cover_letter"] = ""

    # ─── Step 1: Batch Scoring (Economy Tier) ─────────────────────────────────
    batch_size = config.BATCH_SIZE_SCORING
    for i in range(0, total_jobs, batch_size):
        chunk = job_list[i : i + batch_size]
        logger.info("📊 Scoring jobs %d-%d of %d...", i+1, i+len(chunk), total_jobs)
        
        batch_results = score_jobs_batch(resume_json, chunk)
        
        # Apply results back to job objects
        for j, res in enumerate(batch_results):
            chunk[j]["score"] = res.get("score", 0)
            chunk[j]["missing_skills"] = res.get("missing_skills", [])
            chunk[j]["suggestions"] = res.get("suggestions", [])
        
        # Small delay to respect RPM limits
        time.sleep(1.0)
    
    # ─── Step 2: High-Quality Cover Letters (Premium Tier) ────────────────────
    potential_matches = [j for j in job_list if j.get("score", 0) >= config.COVER_LETTER_THRESHOLD]
    
    if not potential_matches:
        logger.warning("⚠️ No jobs reached the score threshold (%d) for cover letters.", config.COVER_LETTER_THRESHOLD)
        return job_list

    logger.info("✨ Found %d threshold-breaking jobs. Generating premium cover letters...", len(potential_matches))
    
    for i, job in enumerate(potential_matches):
        logger.info("✍️ Generating cover letter %d/%d: %s", i+1, len(potential_matches), job.get("title"))
        job["cover_letter"] = generate_premium_cover_letter(resume_json, job)
        
        # 70b models have very tight RPM (3-5 PRM). 
        # Waiting 15s ensures we never hit the limit (4 calls per minute).
        if i < len(potential_matches) - 1:
            time.sleep(15.0)
        
    logger.info("✅ Tiered intelligence processing complete.")
    return job_list
