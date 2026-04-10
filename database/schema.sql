-- database/schema.sql
-- HuntAI - AI Job Hunter Agent
-- Complete Supabase Schema (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    groq_key_validated boolean DEFAULT false,
    onboarding_complete boolean DEFAULT false,
    default_engine text DEFAULT 'playwright',
    default_delay int DEFAULT 120,
    default_max_per_platform int DEFAULT 10,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. JOB RUNS
CREATE TABLE IF NOT EXISTS public.job_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    query text NOT NULL,
    location text,
    experience_level text,
    platforms text[],
    engine text,
    status text DEFAULT 'running', -- running | complete | failed
    total_jobs_found int DEFAULT 0,
    avg_match_score numeric,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    excel_url text,
    error_message text
);

-- 3. INDIVIDUAL JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id uuid REFERENCES public.job_runs(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text,
    company text,
    location text,
    platform text,
    job_url text,
    match_score int,
    missing_skills text[],
    suggestion text,
    cover_letter text,
    posted_at timestamptz,
    scraped_at timestamptz DEFAULT now(),
    saved boolean DEFAULT false
);

-- 4. ERROR LOGS (Phase 8 Requirement)
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    run_id uuid REFERENCES public.job_runs(id) ON DELETE CASCADE,
    level text NOT NULL, -- DEBUG, INFO, WARNING, ERROR, CRITICAL
    phase text, -- scraping | parsing | matching | export | auth
    platform text,
    message text NOT NULL,
    error_type text,
    stack_trace text,
    job_url text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- 5. API USAGE TRACKING
CREATE TABLE IF NOT EXISTS public.api_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    date date DEFAULT current_date,
    runs_count int DEFAULT 0,
    UNIQUE(user_id, date)
);

-- ─── ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see only their own
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Job Runs: Users see and modify only their own
CREATE POLICY "Users see own job_runs" ON public.job_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own job_runs" ON public.job_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own job_runs" ON public.job_runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own job_runs" ON public.job_runs FOR DELETE USING (auth.uid() = user_id);

-- Jobs: Users see and modify only their own
CREATE POLICY "Users see own jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- Error Logs: Users see only their own
CREATE POLICY "Users see own error_logs" ON public.error_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own error_logs" ON public.error_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API Usage: Users see only their own
CREATE POLICY "Users see own api_usage" ON public.api_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert/update own api_usage" ON public.api_usage FOR ALL USING (auth.uid() = user_id);

-- ─── TRIGGERS ──────────────────────────────────────────────────────────────────

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
