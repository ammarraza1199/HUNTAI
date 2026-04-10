# backend/models/schemas.py
# HuntAI - AI Job Hunter Agent
# Pydantic models for request/response bodies

from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

# ─── Auth / User Models ───────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: UUID
    full_name: str
    groq_key_validated: bool
    onboarding_complete: bool
    default_engine: str
    default_delay: int
    default_max_per_platform: int
    created_at: datetime
    updated_at: datetime

# ─── Resume Parsing Models ────────────────────────────────────────────────────

class ResumeParseResponse(BaseModel):
    name: str
    email: Optional[str]
    phone: Optional[str]
    skills: List[str]
    experience_years: float
    summary: str
    raw_text_preview: Optional[str]

# ─── Pipeline Execution Models ────────────────────────────────────────────────

class PipelineStartRequest(BaseModel):
    query: str
    location: str
    experience_level: str # entry|mid|senior|lead
    platforms: List[str] # ["linkedin", "naukri", "indeed"]
    engine: str = "playwright" # playwright|sb|nd
    delay_seconds: int = 120 # 30-300
    max_per_platform: int = 10 # 5-30
    resume_data: Dict[str, Any] # The fully parsed resume JSON

class PipelineStartResponse(BaseModel):
    run_id: UUID
    status: str = "started"

# ─── Job Records Models ───────────────────────────────────────────────────────

class JobRecord(BaseModel):
    id: UUID
    run_id: UUID
    title: str
    company: str
    location: str
    platform: str
    job_url: HttpUrl
    match_score: int
    missing_skills: List[str]
    suggestion: str
    cover_letter: str
    posted_at: Optional[datetime]
    scraped_at: datetime = Field(default_factory=datetime.utcnow)

class JobRunSummary(BaseModel):
    id: UUID
    query: str
    location: str
    status: str
    total_jobs_found: int
    avg_match_score: Optional[float]
    started_at: datetime
    completed_at: Optional[datetime]

# ─── Usage / Logs Models ──────────────────────────────────────────────────────

class UsageLimits(BaseModel):
    runs_today: int
    runs_limit: int = 3
    resets_at: datetime

class ErrorLogRecord(BaseModel):
    id: UUID
    level: str
    phase: str
    platform: Optional[str]
    message: str
    error_type: Optional[str]
    job_url: Optional[str]
    created_at: datetime
