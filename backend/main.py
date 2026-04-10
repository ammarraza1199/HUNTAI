# backend/main.py
# HuntAI - AI Job Hunter Agent
# FastAPI Application Entrypoint

import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables from the backend subfolder
load_dotenv(dotenv_path="backend/.env")

from fastapi import FastAPI, Depends, HTTPException, Header, File, UploadFile, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from typing import List, Dict, Any, Optional
from uuid import uuid4, UUID
from datetime import datetime, timezone

# ─── Internal Imports ──────────────────────────────────────────────────────────
from backend.models.schemas import (
    ResumeParseResponse, PipelineStartRequest, PipelineStartResponse,
    JobRunSummary, JobRecord, UsageLimits
)
from backend.utils.auth import get_current_user
from backend.utils.logger import logger
from backend.services.pipeline import JobHunterPipeline

app = FastAPI(title="HuntAI - AI Job Hunter Agent", version="1.0.0")

# ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ROUTES ───────────────────────────────────────────────────────────────────

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
async def parse_resume(
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

    # 2. Extract Text & Send to Groq (Logic from services/resume_parser.py)
    # Mocking actual parse result
    return {
        "name": "Jane Developer",
        "email": user["email"],
        "phone": "+1234567890",
        "skills": ["Python", "FastAPI", "Next.js", "Docker", "Machine Learning"],
        "experience_years": 4.5,
        "summary": "Full Stack Engineer with experience in AI automation and distributed systems.",
        "raw_text_preview": "RAW EXTRACTED TEXT FROM PDF..."
    }

@app.post("/api/start-pipeline", response_model=PipelineStartResponse)
async def start_pipeline(
    request: PipelineStartRequest,
    user: dict = Depends(get_current_user)
):
    """Starts a non-blocking job hunt pipeline run."""
    # 1. (Check Rate Limits - placeholder)
    
    # 2. Create Run Record in DB
    run_id = uuid4()
    logger.info(f"Starting pipeline {run_id} for user {user['id']}", user_id=user['id'], run_id=run_id)
    
    # 3. Pipeline logic handled via /stream/{run_id} or background task
    return {"run_id": run_id, "status": "started"}

@app.get("/api/stream/{run_id}")
async def stream_pipeline(
    run_id: UUID,
    x_groq_key: str = Header(...),
    user: dict = Depends(get_current_user)
):
    """
    SSE endpoint for real-time log, job, and progress streaming.
    This maintains the connection until the underlying pipeline finishes.
    """
    # 1. Validate permissions (placeholder)
    
    # 2. Initialize and run pipeline
    pipeline = JobHunterPipeline(run_id, UUID(user['id']), {"query": "AI Engineer", "location": "Remote", "platforms": ["linkedin"]})
    
    return StreamingResponse(
        pipeline.run(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.get("/api/runs", response_model=List[JobRunSummary])
async def list_runs(user: dict = Depends(get_current_user)):
    """Returns past job hunt history for the current user."""
    # Mocking Supabase call
    return [
        {
            "id": uuid4(),
            "query": "Software Engineer",
            "location": "Remote",
            "status": "complete",
            "total_jobs_found": 23,
            "avg_match_score": 78.4,
            "started_at": datetime.now(timezone.utc)
        }
    ]

@app.get("/api/runs/{run_id}/export/excel")
async def export_excel(run_id: str, user: dict = Depends(get_current_user)):
    """Downloads the Excel report for a specific run."""
    # 1. (Verify ownership and existence of file - placeholder)
    
    # Mock file path
    dummy_file = "exports/HuntAI_Results_Dummy.xlsx"
    if not os.path.exists("exports"): os.makedirs("exports")
    with open(dummy_file, "w") as f: f.write("dummy content")

    return FileResponse(
        dummy_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"HuntAI_Report_{run_id}.xlsx"
    )

@app.get("/api/usage", response_model=UsageLimits)
async def get_usage(user: dict = Depends(get_current_user)):
    """Returns current user's daily usage limits."""
    return {
        "runs_today": 1,
        "runs_limit": 3,
        "resets_at": datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
