# backend/models/schemas.py
# HuntAI - AI Job Hunter Agent
# Pydantic models for request/response bodies

from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

# ─── Auth / User Models ───────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: str
    full_name: str
    groq_key_validated: bool
    onboarding_complete: bool
    default_engine: str
    default_delay: int
    default_max_per_platform: int
    created_at: datetime
    updated_at: datetime

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    default_engine: Optional[str] = None
    default_delay: Optional[int] = None
    default_max_per_platform: Optional[int] = None

# ─── Resume Parsing Models ────────────────────────────────────────────────────

class ResumeParseResponse(BaseModel):
    name: str
    email: Optional[str]
    phone: Optional[str]
    skills: List[str]
    experience: List[Any] = []
    education: List[Any] = []
    experience_years: float
    summary: str
    raw_text_preview: Optional[str]

# ─── Pipeline Execution Models ────────────────────────────────────────────────

class PipelineStartRequest(BaseModel):
    query: str
    location: Optional[str] = "Global"
    experience_level: str # entry|mid|senior|lead
    platforms: List[str] # ["linkedin", "naukri", "indeed"]
    engine: str = "playwright" # playwright|sb|nd
    delay_seconds: int = 120 # 30-300
    max_per_platform: int = 10 # 5-30
    resume_data: Dict[str, Any] # The fully parsed resume JSON

class PipelineStartResponse(BaseModel):
    run_id: str
    status: str = "started"

# ─── Job Records Models ───────────────────────────────────────────────────────

class JobRecord(BaseModel):
    id: Optional[str] = None
    run_id: str
    title: str
    company: str
    location: str
    platform: str
    job_url: str
    match_score: Optional[int] = 0
    missing_skills: List[str] = []
    suggestion: Optional[str] = ""
    cover_letter: Optional[str] = ""
    work_style: Optional[str] = "On-site"
    posted_at: Optional[datetime] = None
    posted_hours: Optional[float] = 0.0
    scraped_at: datetime = Field(default_factory=datetime.utcnow)

class JobRunSummary(BaseModel):
    id: str
    query: str
    location: str
    status: str
    platforms: List[str] = []
    total_jobs_found: Optional[int] = 0
    avg_match_score: Optional[int] = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# ─── Usage / Logs Models ──────────────────────────────────────────────────────

class UsageLimits(BaseModel):
    runs_today: int
    runs_limit: int = 50
    total_runs: int = 0
    total_jobs: int = 0
    resets_at: datetime

class ErrorLogRecord(BaseModel):
    id: str
    level: str
    phase: str
    platform: Optional[str]
    message: str
    error_type: Optional[str]
    job_url: Optional[str]
    created_at: datetime
