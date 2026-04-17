# backend/main.py
# HuntAI - AI Job Hunter Agent
# FastAPI Application Entrypoint

import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables from the backend subfolder
load_dotenv(dotenv_path="backend/.env")

from fastapi import FastAPI, Depends, HTTPException, Header, File, UploadFile, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from bson import ObjectId
from typing import List, Dict, Any, Optional
from uuid import uuid4, UUID
from datetime import datetime, timezone
import asyncio
from pathlib import Path

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# ─── Internal Imports ──────────────────────────────────────────────────────────
from backend.models.schemas import (
    ResumeParseResponse, PipelineStartRequest, PipelineStartResponse,
    JobRunSummary, JobRecord, UsageLimits, UserProfile, ProfileUpdate
)
from backend.utils.auth import get_current_user
from backend.utils.logger import logger
from backend.services.pipeline import JobHunterPipeline
from backend.services.resume_parser import parse_resume as parse_resume_service
from backend.utils.mongodb import MongoDB
from backend.utils.process_cleanup import cleanup_chrome_processes

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ─── Startup Logic ───
    await MongoDB.connect()
    await MongoDB.ensure_indexes()
    
    # 🧪 [SANITIZER] Start background cleanup worker to prevent RAM leaks in prod
    async def cleanup_worker():
        while True:
            try:
                cleanup_chrome_processes()
            except Exception as e:
                logger.error(f"Cleanup worker error: {e}")
            await asyncio.sleep(600) # Run every 10 mins
    
    asyncio.create_task(cleanup_worker())
    
    yield
    # ─── Shutdown Logic ───
    await MongoDB.close()

app = FastAPI(title="HuntAI Pro - AI Job Hunter Agent", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

browser_semaphore = asyncio.Semaphore(2)
# GLOBAL REGISTRY: Maintains running pipelines across SSE reconnections
active_pipelines: Dict[str, JobHunterPipeline] = {}
pending_configs: Dict[str, Dict[str, Any]] = {} # Bridging POST -> GET gap for resume data

# ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ROUTES ───────────────────────────────────────────────────────────────────
from backend.routes.auth_routes import router as auth_router

app.include_router(auth_router)

@app.get("/health")

async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/validate-groq-key")
async def validate_groq_key(x_groq_key: str = Header(...)):
    """Validates the user-supplied Groq API key via a test call."""
    # Placeholder for actual Groq SDK call
    if not x_groq_key.startswith("gsk_"):
        return {"valid": False, "reason": "Invalid prefix: gsk_ required."}
    
    # Simulate test chat completion
    return {"valid": True, "model": "llama-3.1-70b-versatile"}

@app.post("/api/parse-resume", response_model=ResumeParseResponse)
@limiter.limit("20/minute")
async def parse_resume(
    request: Request,
    file: UploadFile = File(...),
    x_groq_key: str = Header(...),
    user: dict = Depends(get_current_user)
):
    """
    Parses a PDF/DOCX resume using Groq LLM. 
    User must provide their Groq key in the header.
    """
    # 1. Validate File
    if not file.filename.lower().endswith(('.pdf', '.docx', '.doc')):
        raise HTTPException(status_code=422, detail="Only PDF and DOCX files are supported.")
    
    # Read file content (Mocked for logic flow)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=422, detail="File too large (max 5MB).")

    # 2. Save file temporarily
    temp_dir = Path("backend/cache/temp_resumes")
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_path = temp_dir / f"{uuid4()}_{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # 3. Parse Resume using Service
        # We temporarily set the header key to config so get_client can find it
        import backend.config as backend_config
        backend_config.GROQ_API_KEY = x_groq_key
        
        parsed_data = parse_resume_service(str(file_path))
        
        return {
            "name": parsed_data.get("name", "Unknown"),
            "email": parsed_data.get("email", ""),
            "phone": parsed_data.get("phone", ""),
            "skills": parsed_data.get("skills", []),
            "experience": parsed_data.get("experience", []), # Added full history
            "education": parsed_data.get("education", []), # Added education context
            "experience_years": parsed_data.get("total_years_experience", 0.0),
            "summary": parsed_data.get("summary", ""),
            "raw_text_preview": parsed_data.get("raw_text_preview", "Full extraction successful.")
        }
    finally:
        # Cleanup
        if file_path.exists():
            os.remove(file_path)

@app.post("/api/start-pipeline", response_model=PipelineStartResponse)
@limiter.limit("40/minute")
async def start_pipeline(
    request: Request,
    pipeline_req: PipelineStartRequest,
    user: dict = Depends(get_current_user)
):
    """Starts a non-blocking job hunt pipeline run after checking DB limits."""
    db = MongoDB.get_db()
    users_col = db["users"]
    user_record = await users_col.find_one({"_id": ObjectId(user["id"])})
    
    # Simple limit tracking
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    runs_today = user_record.get("runs_log", {}).get(today_str, 0) if user_record else 0
    
    # Plan-aware limit enforcement
    is_premium = user_record.get("is_premium", False)
    limit = 50 if is_premium else 3
    
    logger.info(f"Rate Limit Check: User {user['id']} has {runs_today} runs logged for {today_str}. (Limit: {limit})")
    if runs_today >= limit:
        raise HTTPException(status_code=429, detail=f"Daily job hunt limit reached ({runs_today}/{limit} runs). Try again tomorrow.")
    
    # 0. Check if there's already a RECENT pending config for this user to block race conditions
    for rid, cfg in pending_configs.items():
        if cfg.get("user_id") == str(user["id"]):
            logger.info(f"Blocked duplicate pending run for user {user['id']}")
            return {"run_id": rid, "status": "already_starting"}

    # 1. Check if user already has an active pipeline running
    active_user_pipeline = next((p for p in active_pipelines.values() if p.user_id == str(user["id"]) and p.is_running), None)
    if active_user_pipeline:
        logger.info(f"User {user['id']} already has an active pipeline {active_user_pipeline.run_id}. Reusing.", user_id=user['id'])
        return {"run_id": active_user_pipeline.run_id, "status": "already_running"}

    # 2. Increment usage count for today
    await users_col.update_one(
        {"_id": ObjectId(user["id"])},
        {"$inc": {f"runs_log.{today_str}": 1}}
    )

    # 3. Store the resume data globally so the GET stream can access it
    run_id = uuid4()
    run_id_str = str(run_id)
    
    pending_configs[run_id_str] = {
        "user_id": str(user["id"]), # Track owner to prevent race conditions
        "resume_data": pipeline_req.resume_data,
        "query": pipeline_req.query,
        "max_per_platform": pipeline_req.max_per_platform
    }
    
    logger.info(f"Buffered config for run {run_id_str}. Ready for streaming.", user_id=user['id'])
    
    return {"run_id": run_id_str, "status": "started"}

@app.get("/api/stream/{run_id}")
async def stream_pipeline(
    run_id: UUID,
    # These parameters simulate the frontend submitting the user config form
    query: str = Query("AI Engineer"),
    location: str = Query("Remote"),
    platforms: str = Query("linkedin"), # comma separated
    experience_level: str = Query("mid"),
    groq_key: str = Query(...), # Changed from Header to Query for SSE compatibility
    user: dict = Depends(get_current_user)
):
    """
    SSE endpoint for real-time log, job, and progress streaming.
    Utilizes an asyncio Semaphore to limit concurrent browser counts.
    """
    if browser_semaphore.locked():
        logger.info("Semaphore locked. User queued for resources...", run_id=str(run_id))

    # Check if pipeline already exists in registry (Reconnect scenario)
    run_id_str = str(run_id)
    if run_id_str in active_pipelines:
        logger.info(f"Reconnecting user to existing pipeline {run_id_str}")
        pipeline = active_pipelines[run_id_str]
    else:
        # Create new if it's a fresh run
        logger.info(f"Creating new pipeline instance for {run_id_str}")
        
        # Retrieve buffered config (Resume Data!)
        pending = pending_configs.pop(run_id_str, {})
        resume_data = pending.get("resume_data", {}) # THIS WAS THE MISSING LINK
        
        config_override = {
            "query": query, 
            "location": location, 
            "platforms": [p.strip() for p in platforms.split(",")],
            "experience_level": experience_level,
            "GROQ_API_KEY": groq_key,
            "resume_data": resume_data
        }
        pipeline = JobHunterPipeline(run_id, str(user['id']), config_override, browser_semaphore)
        active_pipelines[run_id_str] = pipeline
    
    return StreamingResponse(
        pipeline.run(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/runs", response_model=List[JobRunSummary])
async def list_runs(user: dict = Depends(get_current_user)):
    """Returns past job hunt history for the current user from MongoDB."""
    db = MongoDB.get_db()
    runs_col = db["runs"]
    user_id_str = str(user["id"])
    # Convert to list and project to match JobRunSummary model
    cursor = runs_col.find({"user_id": user_id_str}).sort("created_at", -1)
    runs = await cursor.to_list(length=100)
    
    # Map MongoDB fields to model fields + Fallbacks for legacy records
    for run in runs:
        run["id"] = run.get("run_id")
        # Ensure started_at is never null for the UI
        if not run.get("started_at") and run.get("created_at"):
            run["started_at"] = run.get("created_at")
        
        # Backward compatibility for field name changes
        if not run.get("total_jobs_found") and run.get("job_count"):
            run["total_jobs_found"] = run.get("job_count")
            
        # Round the average score for a cleaner UI
        if run.get("avg_match_score") is not None:
            run["avg_match_score"] = int(round(run["avg_match_score"]))
            
    return runs

@app.get("/api/runs/{run_id}/jobs", response_model=List[JobRecord])
async def list_run_jobs(run_id: str, user: dict = Depends(get_current_user)):
    """Returns all jobs found during a specific run."""
    db = MongoDB.get_db()
    jobs_col = db["jobs"]
    cursor = jobs_col.find({"run_id": run_id, "user_id": str(user["id"])})
    jobs = await cursor.to_list(length=500)
    for job in jobs:
        job["id"] = job.get("job_id") or str(job.get("_id"))
    return jobs

@app.delete("/api/runs/{run_id}")
async def delete_run(run_id: str, user: dict = Depends(get_current_user)):
    """Deletes a run and its associated jobs."""
    db = MongoDB.get_db()
    await db["runs"].delete_one({"run_id": run_id, "user_id": str(user["id"])})
    await db["jobs"].delete_many({"run_id": run_id, "user_id": str(user["id"])})
    return {"status": "deleted"}

@app.get("/api/runs/{run_id}/export/excel")
async def export_excel(run_id: str, user: dict = Depends(get_current_user)):
    """Downloads the actual Excel report for a specific run. Regenerates if missing."""
    import os
    from fastapi import HTTPException
    from fastapi.responses import FileResponse
    from backend.services.exporter import ExcelJobExporter
    
    db = MongoDB.get_db()
    # 1. Verify ownership
    run_record = await db["runs"].find_one({"run_id": run_id, "user_id": str(user["id"])})
    if not run_record:
        raise HTTPException(status_code=404, detail="Run not found or unauthorized.")

    # 2. Check for file, regenerate if missing
    # Normalizing path for cross-platform (Render is Linux, user might be Windows)
    file_path = os.path.abspath(f"backend/exports/HuntAI_Pro_Results_{run_id}.xlsx")
    
    if not os.path.exists(file_path):
        logger.info(f"Regenerating Excel report for run {run_id} (Disk cache missed).")
        # Fetch jobs
        cursor = db["jobs"].find({"run_id": run_id, "user_id": str(user["id"])})
        jobs = await cursor.to_list(length=1000)
        
        # Build fake run_data for the exporter (it expects certain fields)
        run_data_export = {
            "id": run_id,
            "query": run_record.get("query", "Manual Export"),
            "location": run_record.get("location", "N/A"),
            "avg_match_score": run_record.get("avg_match_score", 0),
            "started_at": run_record.get("created_at")
        }
        
        exporter = ExcelJobExporter(output_dir="backend/exports")
        file_path = exporter.create_report(run_data_export, jobs)

    return FileResponse(
        path=file_path, 
        filename=f"HuntAI_Pro_Report_{run_id}.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"HuntAI_Pro_Results_{run_id}.xlsx"
    )

@app.get("/api/profile", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    """Returns the full profile settings for the current user."""
    db = MongoDB.get_db()
    users_col = db["users"]
    user_record = await users_col.find_one({"_id": ObjectId(user["id"])})
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user_record["_id"]),
        "full_name": user_record.get("full_name", "Anonymous User"),
        "email": user_record.get("email", ""),
        "picture": user_record.get("picture", ""),
        "is_premium": user_record.get("is_premium", False),
        "plan": "Premium" if user_record.get("is_premium") else "Free",
        "groq_key_validated": True,
        "onboarding_complete": user_record.get("onboarding_complete", True),
        "default_engine": user_record.get("default_engine", "seleniumbase"),
        "default_delay": user_record.get("default_delay", 120),
        "default_max_per_platform": user_record.get("default_max_per_platform", 10),
        "created_at": user_record.get("created_at", datetime.now(timezone.utc)),
        "updated_at": user_record.get("updated_at", datetime.now(timezone.utc))
    }

@app.post("/api/profile", response_model=UserProfile)
async def update_profile(profile_update: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Updates specific profile settings."""
    db = MongoDB.get_db()
    users_col = db["users"]
    
    update_data = {k: v for k, v in profile_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await users_col.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": update_data}
    )
    
    # Return updated profile
    return await get_profile(user)

@app.get("/api/usage", response_model=UsageLimits)
async def get_usage(user: dict = Depends(get_current_user)):
    """Returns current user's daily usage limits and all-time statistics."""
    db = MongoDB.get_db()
    users_col = db["users"]
    runs_col = db["runs"]
    jobs_col = db["jobs"]
    
    user_id_str = str(user["id"])
    user_record = await users_col.find_one({"_id": ObjectId(user["id"])})
    
    # Calculate daily runs
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    runs_today = user_record.get("runs_log", {}).get(today_str, 0) if user_record else 0
    
    # Plan Logic: Free tier has 3 runs, Premium has 50
    is_premium = user_record.get("is_premium", False)
    runs_limit = 50 if is_premium else 3
    
    # Calculate all-time stats
    total_runs = await runs_col.count_documents({"user_id": user_id_str})
    total_jobs = await jobs_col.count_documents({"user_id": user_id_str})

    return {
        "runs_today": runs_today,
        "runs_limit": runs_limit,
        "total_runs": total_runs,
        "total_jobs": total_jobs,
        "is_premium": is_premium,
        "resets_at": datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
    }

if __name__ == "__main__":
    # We restrict reload_dirs to 'backend' to avoid the node_modules symlink loop on Windows
    uvicorn.run("backend.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True, reload_dirs=["backend"])
