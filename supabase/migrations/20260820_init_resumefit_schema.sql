-- ResumeFit — Supabase PostgreSQL Schema Migration
-- Evidence-Grounded AI Resume Screening & Recruiter Intelligence Platform

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. Table: jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    job_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Table: candidates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    education JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Table: resumes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_hash TEXT NOT NULL, -- SHA-256 hash for deduplication
    extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. Table: screening_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    total_candidates INTEGER NOT NULL DEFAULT 0,
    processed_candidates INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 5. Table: screening_results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_session_id UUID NOT NULL REFERENCES screening_sessions(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    fit_score NUMERIC NOT NULL DEFAULT 0,
    raw_score NUMERIC,
    status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('strong_match', 'needs_review', 'low_fit')),
    rank INTEGER,
    matched_count INTEGER NOT NULL DEFAULT 0,
    partial_count INTEGER NOT NULL DEFAULT 0,
    missing_count INTEGER NOT NULL DEFAULT 0,
    critical_requirements_met INTEGER NOT NULL DEFAULT 0,
    critical_requirements_total INTEGER NOT NULL DEFAULT 0,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 6. Table: recruiter_decisions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruiter_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_result_id UUID NOT NULL UNIQUE REFERENCES screening_results(id) ON DELETE CASCADE,
    decision TEXT NOT NULL DEFAULT 'undecided' CHECK (decision IN ('undecided', 'shortlisted', 'review', 'rejected')),
    notes TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 7. Table: job_applications (Two-Sided Matching)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    screening_session_id UUID REFERENCES screening_sessions(id) ON DELETE SET NULL,
    fit_score NUMERIC NOT NULL DEFAULT 0,
    raw_score NUMERIC,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'shortlisted', 'interview', 'rejected', 'withdrawn')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_job_candidate UNIQUE (job_id, candidate_id)
);

-- ---------------------------------------------------------------------------
-- Indexes for High Performance Querying & Filtering
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_resumes_file_hash ON resumes(file_hash);
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_screening_sessions_job_id ON screening_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_session ON screening_results(screening_session_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_job ON screening_results(job_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_candidate ON screening_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_screening_results_fit_score ON screening_results(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_screening_results_rank ON screening_results(rank ASC);
CREATE INDEX IF NOT EXISTS idx_screening_results_status ON screening_results(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_decisions_result ON recruiter_decisions(screening_result_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at DESC);
