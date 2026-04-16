// # frontend/types/index.ts
// # HuntAI - AI Job Hunter Agent
// # Unified TypeScript interfaces for frontend/backend parity

export type Platform = 'linkedin' | 'naukri' | 'indeed';
export type Engine = 'playwright' | 'sb' | 'nd';
export type PipelineStatus = 'idle' | 'running' | 'complete' | 'failed';

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  groq_key_validated: boolean;
  onboarding_complete: boolean;
  default_engine: Engine;
  default_delay: number;
  default_max_per_platform: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  run_id: string;
  title: string;
  company: string;
  location: string;
  platform: Platform;
  job_url: string;
  match_score: number;
  missing_skills: string[];
  suggestion: string;
  cover_letter: string;
  posted_hours: number;
  work_style?: string; // Remote, Hybrid, On-site
  posted_at?: string;
  scraped_at: string;
  saved?: boolean;
}

export interface JobRun {
  id: string;
  user_id: string;
  query: string;
  location: string;
  status: PipelineStatus;
  platforms: Platform[];
  total_jobs_found: number;
  avg_match_score?: number;
  started_at: string;
  completed_at?: string;
  excel_url?: string;
  error_message?: string;
}

export interface LogEntry {
  type: 'log' | 'job' | 'progress' | 'complete' | 'error';
  level?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message?: string;
  timestamp: string;
  phase?: string | number;
  percent?: number;
  job?: Job;
  summary?: Partial<JobRun>;
  fatal?: boolean;
}

export interface ResumeParseResponse {
  name: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: any[];
  education: any[];
  experience_years: number;
  summary: string;
  raw_text_preview?: string;
}

export interface PipelineStartRequest {
  query: string;
  location: string;
  experience_level: 'entry' | 'mid' | 'senior' | 'lead';
  platforms: Platform[];
  engine?: Engine;
  delay_seconds?: number;
  max_per_platform?: number;
  resume_data: any;
}

export interface Usage {
  runs_today: number;
  runs_limit: number;
  total_runs: number;
  total_jobs: number;
  resets_at: string;
}
