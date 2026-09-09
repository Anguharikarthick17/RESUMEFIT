-- ============================================================================
-- ResumeFit — Master Schema Migration & Production Demo Dataset
-- Safe, Idempotent, Non-Destructive Migration & Seed
-- Single Source of Truth for Localhost and Netlify Production
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable Required Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. Schema Compatibility: Table `job_openings`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Engineering',
    location TEXT NOT NULL DEFAULT 'Remote',
    work_mode TEXT NOT NULL DEFAULT 'Hybrid',
    experience_level TEXT NOT NULL DEFAULT 'Mid–Senior',
    description TEXT NOT NULL DEFAULT '',
    requirements TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Archived', 'Draft', 'active', 'archived', 'draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent Column Additions for existing `job_openings` table
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'Engineering';
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'Remote';
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'Hybrid';
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS experience_level TEXT NOT NULL DEFAULT 'Mid–Senior';
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS requirements TEXT NOT NULL DEFAULT '';
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- 3. Schema Compatibility: Table `jobs` (Legacy compatibility if exists as table)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'Hybrid';
        ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'Mid–Senior';
        ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Schema Compatibility: Table `candidates`
-- Fix missing columns on existing production table without losing any data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    education JSONB DEFAULT '[]'::jsonb,
    experience TEXT DEFAULT '',
    skills TEXT DEFAULT '',
    certifications JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    role TEXT DEFAULT 'Software Engineer',
    fit_score INTEGER DEFAULT 0,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    highest_degree TEXT,
    most_recent_role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add all required columns if table already existed
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Software Engineer';
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS fit_score INTEGER DEFAULT 0;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS highest_degree TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS most_recent_role TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- Safely ensure `experience` and `skills` can accept textual data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'candidates' 
          AND column_name = 'experience' AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE public.candidates ALTER COLUMN experience TYPE TEXT USING experience::text;
        ALTER TABLE public.candidates ALTER COLUMN experience DROP DEFAULT;
        ALTER TABLE public.candidates ALTER COLUMN experience SET DEFAULT '';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'candidates' 
          AND column_name = 'skills' AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE public.candidates ALTER COLUMN skills TYPE TEXT USING skills::text;
        ALTER TABLE public.candidates ALTER COLUMN skills DROP DEFAULT;
        ALTER TABLE public.candidates ALTER COLUMN skills SET DEFAULT '';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Schema Compatibility: Table `screenings`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_opening_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
    fit_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Needs Review',
    recommendation TEXT NOT NULL DEFAULT 'Needs Review',
    review_status TEXT NOT NULL DEFAULT 'undecided' CHECK (review_status IN ('undecided', 'shortlisted', 'review', 'rejected')),
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe Column Additions for existing `screenings` table
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE;
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE;
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS fit_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Needs Review';
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS recommendation TEXT NOT NULL DEFAULT 'Needs Review';
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'undecided';
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.screenings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Idempotent unique constraint on (candidate_id, job_opening_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_candidate_job_screening'
    ) THEN
        ALTER TABLE public.screenings 
        ADD CONSTRAINT unique_candidate_job_screening UNIQUE (candidate_id, job_opening_id);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Schema Compatibility: Table `recruiter_decisions`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruiter_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screening_id UUID REFERENCES public.screenings(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
    decision TEXT NOT NULL DEFAULT 'undecided' CHECK (decision IN ('undecided', 'shortlisted', 'review', 'rejected')),
    notes TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column additions and constraint relaxations for existing table
ALTER TABLE public.recruiter_decisions ADD COLUMN IF NOT EXISTS screening_id UUID REFERENCES public.screenings(id) ON DELETE CASCADE;
ALTER TABLE public.recruiter_decisions ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE;
ALTER TABLE public.recruiter_decisions ADD COLUMN IF NOT EXISTS job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE;
ALTER TABLE public.recruiter_decisions ADD COLUMN IF NOT EXISTS decision TEXT NOT NULL DEFAULT 'undecided';
ALTER TABLE public.recruiter_decisions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.recruiter_decisions ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- If legacy table had `screening_result_id` as NOT NULL, relax it safely
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'recruiter_decisions' 
          AND column_name = 'screening_result_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.recruiter_decisions ALTER COLUMN screening_result_id DROP NOT NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Schema Compatibility: Table `screening_history`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.screening_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
    job_title TEXT NOT NULL,
    job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE SET NULL,
    fit_score INTEGER NOT NULL DEFAULT 0,
    recommendation TEXT NOT NULL DEFAULT 'Needs Review',
    matched_count INTEGER NOT NULL DEFAULT 0,
    missing_count INTEGER NOT NULL DEFAULT 0,
    total_requirements INTEGER NOT NULL DEFAULT 0,
    job_readiness INTEGER NOT NULL DEFAULT 0,
    recruiter_action TEXT NOT NULL DEFAULT 'UNDECIDED',
    screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS analysis_id TEXT;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS candidate_name TEXT;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE SET NULL;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS fit_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS recommendation TEXT NOT NULL DEFAULT 'Needs Review';
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS matched_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS missing_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS total_requirements INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS job_readiness INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS recruiter_action TEXT NOT NULL DEFAULT 'UNDECIDED';
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.screening_history ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ----------------------------------------------------------------------------
-- 8. High-Performance Query Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_job_openings_status ON public.job_openings(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_is_demo ON public.candidates(is_demo);
CREATE INDEX IF NOT EXISTS idx_screenings_job_id ON public.screenings(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_screenings_candidate_id ON public.screenings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_screenings_fit_score ON public.screenings(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_screenings_review_status ON public.screenings(review_status);
CREATE INDEX IF NOT EXISTS idx_history_screened_at ON public.screening_history(screened_at DESC);

-- ----------------------------------------------------------------------------
-- 9. Row Level Security (RLS) Configuration
-- Enable RLS and grant explicit public / anon access for application functionality
-- ----------------------------------------------------------------------------
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_history ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies: Drop old and recreate
DROP POLICY IF EXISTS "Allow public read access on job_openings" ON public.job_openings;
DROP POLICY IF EXISTS "Allow public insert on job_openings" ON public.job_openings;
DROP POLICY IF EXISTS "Allow public update on job_openings" ON public.job_openings;

CREATE POLICY "Allow public read access on job_openings" ON public.job_openings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on job_openings" ON public.job_openings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on job_openings" ON public.job_openings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access on candidates" ON public.candidates;
DROP POLICY IF EXISTS "Allow public insert on candidates" ON public.candidates;
DROP POLICY IF EXISTS "Allow public update on candidates" ON public.candidates;

CREATE POLICY "Allow public read access on candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Allow public insert on candidates" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on candidates" ON public.candidates FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access on screenings" ON public.screenings;
DROP POLICY IF EXISTS "Allow public insert on screenings" ON public.screenings;
DROP POLICY IF EXISTS "Allow public update on screenings" ON public.screenings;

CREATE POLICY "Allow public read access on screenings" ON public.screenings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on screenings" ON public.screenings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on screenings" ON public.screenings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access on recruiter_decisions" ON public.recruiter_decisions;
DROP POLICY IF EXISTS "Allow public insert on recruiter_decisions" ON public.recruiter_decisions;
DROP POLICY IF EXISTS "Allow public update on recruiter_decisions" ON public.recruiter_decisions;

CREATE POLICY "Allow public read access on recruiter_decisions" ON public.recruiter_decisions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on recruiter_decisions" ON public.recruiter_decisions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on recruiter_decisions" ON public.recruiter_decisions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access on screening_history" ON public.screening_history;
DROP POLICY IF EXISTS "Allow public insert on screening_history" ON public.screening_history;
DROP POLICY IF EXISTS "Allow public delete on screening_history" ON public.screening_history;

CREATE POLICY "Allow public read access on screening_history" ON public.screening_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on screening_history" ON public.screening_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on screening_history" ON public.screening_history FOR DELETE USING (true);

-- ----------------------------------------------------------------------------
-- 10. Seed 3 Active Job Openings (Stable Deterministic UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.job_openings (id, title, department, location, work_mode, experience_level, description, requirements, status)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'AI / Machine Learning Engineer',
    'Engineering & Data',
    'San Francisco, CA',
    'Hybrid',
    'Mid–Senior',
    'Build, train, evaluate, and deploy machine learning systems for production applications. Work with Python, data pipelines, model evaluation, and AI infrastructure.',
    'Python, Machine Learning, PyTorch or TensorFlow, SQL, Data Pipelines, Git, Cloud Platforms.',
    'Active'
),
(
    '00000000-0000-0000-0000-000000000002',
    'Java Software Engineer',
    'Backend Platform',
    'Remote / US',
    'Remote',
    'Mid–Senior',
    'Develop scalable backend services, microservices, and REST APIs using Java and Spring Boot.',
    'Java, Spring Boot, REST APIs, Microservices, PostgreSQL, Git, Docker.',
    'Active'
),
(
    '00000000-0000-0000-0000-000000000003',
    'Senior Full Stack Developer',
    'Core Product',
    'New York, NY',
    'Hybrid',
    'Mid–Senior',
    'Build and maintain production web applications across frontend and backend systems with a focus on performance, reliability, and user experience.',
    'React, TypeScript, Node.js, PostgreSQL, REST APIs, Git, Cloud Deployment.',
    'Active'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    department = EXCLUDED.department,
    location = EXCLUDED.location,
    work_mode = EXCLUDED.work_mode,
    experience_level = EXCLUDED.experience_level,
    description = EXCLUDED.description,
    requirements = EXCLUDED.requirements,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Also mirror into `jobs` table if physical table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND table_type = 'BASE TABLE'
    ) THEN
        INSERT INTO public.jobs (id, title, department, location, job_description, status)
        VALUES
        (
            '00000000-0000-0000-0000-000000000001',
            'AI / Machine Learning Engineer',
            'Engineering & Data',
            'San Francisco, CA',
            'Build, train, evaluate, and deploy machine learning systems for production applications. Work with Python, data pipelines, model evaluation, and AI infrastructure.',
            'active'
        ),
        (
            '00000000-0000-0000-0000-000000000002',
            'Java Software Engineer',
            'Backend Platform',
            'Remote / US',
            'Develop scalable backend services, microservices, and REST APIs using Java and Spring Boot.',
            'active'
        ),
        (
            '00000000-0000-0000-0000-000000000003',
            'Senior Full Stack Developer',
            'Core Product',
            'New York, NY',
            'Build and maintain production web applications across frontend and backend systems with a focus on performance, reliability, and user experience.',
            'active'
        )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            department = EXCLUDED.department,
            location = EXCLUDED.location,
            job_description = EXCLUDED.job_description,
            status = EXCLUDED.status,
            updated_at = NOW();
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 11. Seed 10 Fictional Demo Candidates (Stable Deterministic UUIDs)
-- All candidates explicitly marked with `is_demo = true`
-- ----------------------------------------------------------------------------
INSERT INTO public.candidates (id, name, email, role, experience, skills, fit_score, is_demo, phone, location, linkedin_url, highest_degree, most_recent_role, summary)
VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'Aarav Sharma',
    'aarav.sharma@example.com',
    'Machine Learning Engineer',
    '4 years',
    'Python, PyTorch, SQL, Machine Learning, Docker',
    92,
    true,
    '+1 (555) 234-5671',
    'San Francisco, CA',
    'https://linkedin.com/in/aaravsharma-ml',
    'M.S. in Computer Science — Stanford University',
    'Senior ML Engineer — Apex AI Labs (2022–Present)',
    'Experienced machine learning engineer specializing in deep learning architectures, model deployment, and high-throughput inference.'
),
(
    '10000000-0000-0000-0000-000000000002',
    'Diya Menon',
    'diya.menon@example.com',
    'ML Engineer',
    '3 years',
    'Python, TensorFlow, NLP, SQL, AWS',
    86,
    true,
    '+1 (555) 234-5672',
    'San Jose, CA',
    'https://linkedin.com/in/diyamennon-ai',
    'B.S. in Data Science — UC Berkeley',
    'Machine Learning Engineer — Cognita Solutions (2023–Present)',
    'Applied AI specialist building NLP systems, automated text processing pipelines, and production inference models on AWS.'
),
(
    '10000000-0000-0000-0000-000000000003',
    'Rohan Kapoor',
    'rohan.kapoor@example.com',
    'Data Engineer',
    '5 years',
    'Python, SQL, Spark, AWS, Docker',
    78,
    true,
    '+1 (555) 234-5673',
    'Seattle, WA',
    'https://linkedin.com/in/rohankapoor-data',
    'B.S. in Information Systems — University of Washington',
    'Lead Data Pipeline Engineer — StreamData Corp (2021–Present)',
    'Data systems engineer with deep expertise in distributed data pipelines, cloud warehouses, and ETL orchestration.'
),
(
    '10000000-0000-0000-0000-000000000004',
    'Meera Iyer',
    'meera.iyer@example.com',
    'Java Developer',
    '5 years',
    'Java, Spring Boot, REST API, PostgreSQL, Docker',
    94,
    true,
    '+1 (555) 345-6781',
    'Austin, TX (Remote)',
    'https://linkedin.com/in/meeraiyer-java',
    'B.Tech in Computer Engineering — NIT Trichy',
    'Staff Backend Engineer — Enterprise Core Systems (2021–Present)',
    'Seasoned Java developer with enterprise experience building low-latency microservices, robust REST APIs, and scalable databases.'
),
(
    '10000000-0000-0000-0000-000000000005',
    'Arjun Nair',
    'arjun.nair@example.com',
    'Backend Engineer',
    '4 years',
    'Java, Spring Boot, Microservices, Kafka, PostgreSQL',
    88,
    true,
    '+1 (555) 345-6782',
    'Chicago, IL (Remote)',
    'https://linkedin.com/in/arjunnair-backend',
    'M.S. in Software Engineering — UIUC',
    'Senior Java Platform Engineer — NextGen FinTech (2022–Present)',
    'Backend platform engineer focused on event-driven architectures with Apache Kafka, Spring Boot microservices, and database tuning.'
),
(
    '10000000-0000-0000-0000-000000000006',
    'Kavya Rao',
    'kavya.rao@example.com',
    'Software Engineer',
    '3 years',
    'Java, React, Spring Boot, SQL',
    73,
    true,
    '+1 (555) 345-6783',
    'Atlanta, GA (Remote)',
    'https://linkedin.com/in/kavyarao-dev',
    'B.S. in Computer Science — Georgia Tech',
    'Software Engineer — Omnichannel Tech (2023–Present)',
    'Full stack engineer comfortable with Spring Boot backends and interactive web interfaces, seeking high-scale backend focus.'
),
(
    '10000000-0000-0000-0000-000000000007',
    'Vihaan Patel',
    'vihaan.patel@example.com',
    'Full Stack Developer',
    '6 years',
    'React, TypeScript, Node.js, PostgreSQL, AWS',
    96,
    true,
    '+1 (555) 456-7891',
    'New York, NY',
    'https://linkedin.com/in/vihaanpatel-fullstack',
    'B.S. in Computer Science — Columbia University',
    'Lead Full Stack Architect — Prism Cloud SaaS (2020–Present)',
    'Senior engineer with extensive full-stack web architecture experience across modern React, TypeScript, cloud microservices, and high-load databases.'
),
(
    '10000000-0000-0000-0000-000000000008',
    'Ananya Krishnan',
    'ananya.krishnan@example.com',
    'Full Stack Engineer',
    '4 years',
    'React, Node.js, TypeScript, MongoDB, Docker',
    84,
    true,
    '+1 (555) 456-7892',
    'Brooklyn, NY',
    'https://linkedin.com/in/ananyakrishnan-tech',
    'B.E. in Information Technology — Anna University',
    'Full Stack Engineer — Hyperion Digital (2022–Present)',
    'Product-oriented engineer passionate about responsive TypeScript React frontends, Node.js REST services, and scalable web apps.'
),
(
    '10000000-0000-0000-0000-000000000009',
    'Aditya Verma',
    'aditya.verma@example.com',
    'Frontend Developer',
    '3 years',
    'React, JavaScript, TypeScript, CSS',
    68,
    true,
    '+1 (555) 456-7893',
    'Jersey City, NJ',
    'https://linkedin.com/in/adityaverma-frontend',
    'B.A. in Web & Interactive Media — NYU',
    'Frontend UI Developer — Studio Craft Web (2023–Present)',
    'Creative frontend developer with strong design sensitivity, polished React components, and component library maintenance skills.'
),
(
    '10000000-0000-0000-0000-000000000010',
    'Ishita Das',
    'ishita.das@example.com',
    'Software Developer',
    '2 years',
    'JavaScript, React, Node.js, SQL',
    58,
    true,
    '+1 (555) 456-7894',
    'Queens, NY',
    'https://linkedin.com/in/ishitadas-dev',
    'B.S. in Software Engineering — Rutgers University',
    'Junior Software Developer — Nova Labs (2024–Present)',
    'Motivated developer with 2 years of foundational web engineering experience across React client interfaces and Node.js APIs.'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    experience = EXCLUDED.experience,
    skills = EXCLUDED.skills,
    fit_score = EXCLUDED.fit_score,
    is_demo = EXCLUDED.is_demo,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    linkedin_url = EXCLUDED.linkedin_url,
    highest_degree = EXCLUDED.highest_degree,
    most_recent_role = EXCLUDED.most_recent_role,
    summary = EXCLUDED.summary,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 12. Seed 10 Realistic Screenings with Real Evidence & Requirements
-- ----------------------------------------------------------------------------
-- Job 1: AI / Machine Learning Engineer (Candidates: Aarav 92%, Diya 86%, Rohan 78%)
-- Job 2: Java Software Engineer (Candidates: Meera 94%, Arjun 88%, Kavya 73%)
-- Job 3: Senior Full Stack Developer (Candidates: Vihaan 96%, Ananya 84%, Aditya 68%, Ishita 58%)

INSERT INTO public.screenings (id, candidate_id, job_opening_id, fit_score, status, recommendation, review_status, evidence, requirements)
VALUES
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    92,
    'Strong Match',
    'Strong Match',
    'shortlisted',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Aarav Sharma", "evidence": "Aarav Sharma | Senior ML Engineer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "Python, PyTorch, SQL, Machine Learning, Docker", "evidence": "Technical Skills: Python, PyTorch, SQL, Machine Learning, Docker", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Senior ML Engineer — Apex AI Labs (4 years)", "evidence": "Apex AI Labs — Senior ML Engineer (4 years total experience in production systems)", "source_section": "Experience"},
        {"field_id": "EDUCATION-DEGREE", "category": "Education", "status": "FOUND", "value": "M.S. in Computer Science — Stanford University", "evidence": "Stanford University — M.S. in Computer Science", "source_section": "Education"}
    ]'::jsonb,
    '[
        {"requirement": "Python", "match_status": "MATCHED", "explanation": "Listed in candidate skills and demonstrated across 4 years of ML engineering.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Machine Learning", "match_status": "MATCHED", "explanation": "Core domain listed in role and technical skills.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PyTorch or TensorFlow", "match_status": "MATCHED", "explanation": "PyTorch explicitly identified in production inference pipelines.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "SQL", "match_status": "MATCHED", "explanation": "Extracted from candidate database skills.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Data Pipelines", "match_status": "MATCHED", "explanation": "Demonstrated experience building automated data feeding pipelines.", "confidence": "high", "evidence_ref": "EXPERIENCE-ROLE"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Version control listed in technical proficiencies.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Cloud Platforms", "match_status": "MATCHED", "explanation": "Cloud deployment listed in candidate proficiencies.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    86,
    'Strong Match',
    'Strong Match',
    'review',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Diya Menon", "evidence": "Diya Menon | ML Engineer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "Python, TensorFlow, NLP, SQL, AWS", "evidence": "Skills: Python, TensorFlow, NLP, SQL, AWS", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Machine Learning Engineer — Cognita Solutions (3 years)", "evidence": "Cognita Solutions — 3 years experience in NLP and model training", "source_section": "Experience"},
        {"field_id": "EDUCATION-DEGREE", "category": "Education", "status": "FOUND", "value": "B.S. in Data Science — UC Berkeley", "evidence": "UC Berkeley — B.S. in Data Science", "source_section": "Education"}
    ]'::jsonb,
    '[
        {"requirement": "Python", "match_status": "MATCHED", "explanation": "Python listed in technical skills.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Machine Learning", "match_status": "MATCHED", "explanation": "Extracted from role title and technical skills.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PyTorch or TensorFlow", "match_status": "MATCHED", "explanation": "TensorFlow explicitly listed in skills.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "SQL", "match_status": "MATCHED", "explanation": "Extracted from relational database skills.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Data Pipelines", "match_status": "PARTIAL", "explanation": "ETL data ingestion referenced; large-scale pipeline tooling not specified.", "confidence": "medium", "evidence_ref": "EXPERIENCE-ROLE"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Cloud Platforms", "match_status": "MATCHED", "explanation": "AWS platform experience verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    78,
    'Needs Review',
    'Needs Review',
    'review',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Rohan Kapoor", "evidence": "Rohan Kapoor | Data Engineer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "Python, SQL, Spark, AWS, Docker", "evidence": "Skills: Python, SQL, Spark, AWS, Docker", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Lead Data Pipeline Engineer — StreamData Corp (5 years)", "evidence": "StreamData Corp — 5 years building enterprise data infrastructure", "source_section": "Experience"}
    ]'::jsonb,
    '[
        {"requirement": "Python", "match_status": "MATCHED", "explanation": "Python strongly represented in data engineering work.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Machine Learning", "match_status": "PARTIAL", "explanation": "Data pipeline support for ML models mentioned, but deep modeling not primary.", "confidence": "medium", "evidence_ref": "EXPERIENCE-ROLE"},
        {"requirement": "PyTorch or TensorFlow", "match_status": "MISSING", "explanation": "Neither PyTorch nor TensorFlow found in resume.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "SQL", "match_status": "MATCHED", "explanation": "High SQL proficiency detected in data engineering experience.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Data Pipelines", "match_status": "MATCHED", "explanation": "Strong match with Spark data pipelines.", "confidence": "high", "evidence_ref": "EXPERIENCE-ROLE"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Cloud Platforms", "match_status": "MATCHED", "explanation": "AWS platform verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    94,
    'Strong Match',
    'Strong Match',
    'shortlisted',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Meera Iyer", "evidence": "Meera Iyer | Staff Backend Engineer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "Java, Spring Boot, REST API, PostgreSQL, Docker", "evidence": "Skills: Java, Spring Boot, REST API, PostgreSQL, Docker", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Staff Backend Engineer — Enterprise Core Systems (5 years)", "evidence": "Enterprise Core Systems — 5 years building scalable Java Spring Boot microservices", "source_section": "Experience"},
        {"field_id": "EDUCATION-DEGREE", "category": "Education", "status": "FOUND", "value": "B.Tech in Computer Engineering — NIT Trichy", "evidence": "NIT Trichy — B.Tech in Computer Engineering", "source_section": "Education"}
    ]'::jsonb,
    '[
        {"requirement": "Java", "match_status": "MATCHED", "explanation": "Java listed as primary backend language across 5 years.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Spring Boot", "match_status": "MATCHED", "explanation": "Spring Boot framework used in production microservices.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "REST APIs", "match_status": "MATCHED", "explanation": "REST API development verified in role responsibilities.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Microservices", "match_status": "MATCHED", "explanation": "Microservices architecture documented in recent role.", "confidence": "high", "evidence_ref": "EXPERIENCE-ROLE"},
        {"requirement": "PostgreSQL", "match_status": "MATCHED", "explanation": "PostgreSQL database queries and schema design confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Docker", "match_status": "MATCHED", "explanation": "Docker containerization extracted from skills.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    88,
    'Strong Match',
    'Strong Match',
    'review',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Arjun Nair", "evidence": "Arjun Nair | Backend Engineer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "Java, Spring Boot, Microservices, Kafka, PostgreSQL", "evidence": "Stack: Java, Spring Boot, Microservices, Kafka, PostgreSQL", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Senior Java Platform Engineer — NextGen FinTech (4 years)", "evidence": "NextGen FinTech — 4 years building financial event platforms", "source_section": "Experience"}
    ]'::jsonb,
    '[
        {"requirement": "Java", "match_status": "MATCHED", "explanation": "Strong Java background in FinTech platform engineering.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Spring Boot", "match_status": "MATCHED", "explanation": "Spring Boot framework used for backend services.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "REST APIs", "match_status": "MATCHED", "explanation": "REST services developed alongside Kafka event messaging.", "confidence": "high", "evidence_ref": "EXPERIENCE-ROLE"},
        {"requirement": "Microservices", "match_status": "MATCHED", "explanation": "Microservices platform listed in role.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PostgreSQL", "match_status": "MATCHED", "explanation": "PostgreSQL relational data store confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Docker", "match_status": "MATCHED", "explanation": "Docker containerized deployments verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000002',
    73,
    'Needs Review',
    'Needs Review',
    'review',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Kavya Rao", "evidence": "Kavya Rao | Software Engineer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "Java, React, Spring Boot, SQL", "evidence": "Skills: Java, React, Spring Boot, SQL", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Software Engineer — Omnichannel Tech (3 years)", "evidence": "Omnichannel Tech — 3 years general software engineering", "source_section": "Experience"}
    ]'::jsonb,
    '[
        {"requirement": "Java", "match_status": "MATCHED", "explanation": "Java listed in candidate skill set.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Spring Boot", "match_status": "MATCHED", "explanation": "Spring Boot confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "REST APIs", "match_status": "PARTIAL", "explanation": "General API integration listed without dedicated microservice architecture.", "confidence": "medium", "evidence_ref": "EXPERIENCE-ROLE"},
        {"requirement": "Microservices", "match_status": "MISSING", "explanation": "No microservices architecture experience found in resume.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PostgreSQL", "match_status": "PARTIAL", "explanation": "Generic SQL listed; PostgreSQL specifics not mentioned.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Docker", "match_status": "MISSING", "explanation": "Docker containerization not mentioned.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000003',
    96,
    'Strong Match',
    'Strong Match',
    'shortlisted',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Vihaan Patel", "evidence": "Vihaan Patel | Full Stack Developer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "React, TypeScript, Node.js, PostgreSQL, AWS", "evidence": "Skills: React, TypeScript, Node.js, PostgreSQL, AWS", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Lead Full Stack Architect — Prism Cloud SaaS (6 years)", "evidence": "Prism Cloud SaaS — 6 years delivering production web applications", "source_section": "Experience"},
        {"field_id": "EDUCATION-DEGREE", "category": "Education", "status": "FOUND", "value": "B.S. in Computer Science — Columbia University", "evidence": "Columbia University — B.S. in Computer Science", "source_section": "Education"}
    ]'::jsonb,
    '[
        {"requirement": "React", "match_status": "MATCHED", "explanation": "Extensive 6-year React production development.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "TypeScript", "match_status": "MATCHED", "explanation": "TypeScript listed as core frontend and backend language.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Node.js", "match_status": "MATCHED", "explanation": "Node.js backend service development verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PostgreSQL", "match_status": "MATCHED", "explanation": "PostgreSQL relational database design documented.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "REST APIs", "match_status": "MATCHED", "explanation": "RESTful API creation documented across multiple systems.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Cloud Deployment", "match_status": "MATCHED", "explanation": "AWS cloud deployments and Docker containers verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000003',
    84,
    'Strong Match',
    'Strong Match',
    'review',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Ananya Krishnan", "evidence": "Ananya Krishnan | Full Stack Engineer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "React, Node.js, TypeScript, MongoDB, Docker", "evidence": "Skills: React, Node.js, TypeScript, MongoDB, Docker", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Full Stack Engineer — Hyperion Digital (4 years)", "evidence": "Hyperion Digital — 4 years building responsive web systems", "source_section": "Experience"}
    ]'::jsonb,
    '[
        {"requirement": "React", "match_status": "MATCHED", "explanation": "React confirmed in production frontend work.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "TypeScript", "match_status": "MATCHED", "explanation": "TypeScript proficiency confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Node.js", "match_status": "MATCHED", "explanation": "Node.js backend verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PostgreSQL", "match_status": "PARTIAL", "explanation": "Primary database is MongoDB; basic relational understanding noted.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "REST APIs", "match_status": "MATCHED", "explanation": "REST APIs development verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Cloud Deployment", "match_status": "PARTIAL", "explanation": "Docker containers verified, direct cloud deployment not explicitly noted.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000003',
    68,
    'Needs Review',
    'Needs Review',
    'review',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Aditya Verma", "evidence": "Aditya Verma | Frontend Developer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "React, JavaScript, TypeScript, CSS", "evidence": "Skills: React, JavaScript, TypeScript, CSS", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Frontend UI Developer — Studio Craft Web (3 years)", "evidence": "Studio Craft Web — 3 years building responsive UI interfaces", "source_section": "Experience"}
    ]'::jsonb,
    '[
        {"requirement": "React", "match_status": "MATCHED", "explanation": "React verified with high proficiency.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "TypeScript", "match_status": "MATCHED", "explanation": "TypeScript verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Node.js", "match_status": "PARTIAL", "explanation": "Basic Node.js tooling mentioned, production backend experience missing.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PostgreSQL", "match_status": "MISSING", "explanation": "PostgreSQL database experience not found in resume.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "REST APIs", "match_status": "PARTIAL", "explanation": "API consumption demonstrated, endpoint development not verified.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Git", "match_status": "MATCHED", "explanation": "Git version control confirmed.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Cloud Deployment", "match_status": "MISSING", "explanation": "Cloud deployment experience missing.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
),
(
    '20000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    58,
    'Needs Review',
    'Needs Review',
    'review',
    '[
        {"field_id": "CONTACT-NAME", "category": "Candidate Name", "status": "FOUND", "value": "Ishita Das", "evidence": "Ishita Das | Software Developer", "source_section": "Header"},
        {"field_id": "SKILLS-LIST", "category": "Skills", "status": "FOUND", "value": "JavaScript, React, Node.js, SQL", "evidence": "Skills: JavaScript, React, Node.js, SQL", "source_section": "Skills"},
        {"field_id": "EXPERIENCE-ROLE", "category": "Experience", "status": "FOUND", "value": "Junior Software Developer — Nova Labs (2 years)", "evidence": "Nova Labs — 2 years software developer", "source_section": "Experience"}
    ]'::jsonb,
    '[
        {"requirement": "React", "match_status": "MATCHED", "explanation": "React foundational experience verified.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "TypeScript", "match_status": "MISSING", "explanation": "TypeScript not explicitly listed; JavaScript primary.", "confidence": "high", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Node.js", "match_status": "PARTIAL", "explanation": "Node.js listed for simple server scripts.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "PostgreSQL", "match_status": "PARTIAL", "explanation": "Generic SQL listed without advanced PostgreSQL optimization.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "REST APIs", "match_status": "PARTIAL", "explanation": "Basic API creation demonstrated in junior role.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Git", "match_status": "PARTIAL", "explanation": "Basic version control assumed.", "confidence": "medium", "evidence_ref": "SKILLS-LIST"},
        {"requirement": "Cloud Deployment", "match_status": "MISSING", "explanation": "Production cloud infrastructure deployment missing.", "confidence": "high", "evidence_ref": "SKILLS-LIST"}
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    candidate_id = EXCLUDED.candidate_id,
    job_opening_id = EXCLUDED.job_opening_id,
    fit_score = EXCLUDED.fit_score,
    status = EXCLUDED.status,
    recommendation = EXCLUDED.recommendation,
    review_status = EXCLUDED.review_status,
    evidence = EXCLUDED.evidence,
    requirements = EXCLUDED.requirements,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 13. Seed 3 Shortlisted Recruiter Decisions (Stable Deterministic UUIDs)
-- Aarav Sharma (AI/ML), Meera Iyer (Java), Vihaan Patel (Full Stack)
-- ----------------------------------------------------------------------------
INSERT INTO public.recruiter_decisions (id, screening_id, candidate_id, job_opening_id, decision, notes, decided_at)
VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'shortlisted',
    'Exceptional ML background with Stanford M.S. and proven PyTorch deployment. Approved for technical panel interview.',
    NOW() - INTERVAL '2 days'
),
(
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'shortlisted',
    'Solid 5-year Java Spring Boot microservices track record. Strong fit for backend platform team.',
    NOW() - INTERVAL '1 day'
),
(
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000003',
    'shortlisted',
    'Top candidate for Senior Full Stack role. 96% fit score with full React, TypeScript, and AWS architecture mastery.',
    NOW() - INTERVAL '3 hours'
)
ON CONFLICT (id) DO UPDATE SET
    screening_id = EXCLUDED.screening_id,
    candidate_id = EXCLUDED.candidate_id,
    job_opening_id = EXCLUDED.job_opening_id,
    decision = EXCLUDED.decision,
    notes = EXCLUDED.notes,
    decided_at = EXCLUDED.decided_at;

-- ----------------------------------------------------------------------------
-- 14. Seed Screening History / Audit Trail (Stable Deterministic UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.screening_history (id, analysis_id, candidate_name, candidate_id, job_title, job_opening_id, fit_score, recommendation, matched_count, missing_count, total_requirements, job_readiness, recruiter_action, screened_at, data)
VALUES
(
    '40000000-0000-0000-0000-000000000001',
    'RF-A19F82',
    'Aarav Sharma',
    '10000000-0000-0000-0000-000000000001',
    'AI / Machine Learning Engineer',
    '00000000-0000-0000-0000-000000000001',
    92,
    'Strong Match',
    7,
    0,
    7,
    95,
    'SHORTLISTED',
    NOW() - INTERVAL '2 days',
    '{"full_name": "Aarav Sharma", "targetRole": "AI / Machine Learning Engineer", "fitScore": 92}'::jsonb
),
(
    '40000000-0000-0000-0000-000000000002',
    'RF-B83C41',
    'Diya Menon',
    '10000000-0000-0000-0000-000000000002',
    'AI / Machine Learning Engineer',
    '00000000-0000-0000-0000-000000000001',
    86,
    'Strong Match',
    6,
    0,
    7,
    88,
    'REVIEW',
    NOW() - INTERVAL '2 days',
    '{"full_name": "Diya Menon", "targetRole": "AI / Machine Learning Engineer", "fitScore": 86}'::jsonb
),
(
    '40000000-0000-0000-0000-000000000003',
    'RF-C74D90',
    'Meera Iyer',
    '10000000-0000-0000-0000-000000000004',
    'Java Software Engineer',
    '00000000-0000-0000-0000-000000000002',
    94,
    'Strong Match',
    7,
    0,
    7,
    96,
    'SHORTLISTED',
    NOW() - INTERVAL '1 day',
    '{"full_name": "Meera Iyer", "targetRole": "Java Software Engineer", "fitScore": 94}'::jsonb
),
(
    '40000000-0000-0000-0000-000000000004',
    'RF-D11A62',
    'Vihaan Patel',
    '10000000-0000-0000-0000-000000000007',
    'Senior Full Stack Developer',
    '00000000-0000-0000-0000-000000000003',
    96,
    'Strong Match',
    7,
    0,
    7,
    98,
    'SHORTLISTED',
    NOW() - INTERVAL '3 hours',
    '{"full_name": "Vihaan Patel", "targetRole": "Senior Full Stack Developer", "fitScore": 96}'::jsonb
),
(
    '40000000-0000-0000-0000-000000000005',
    'RF-E55F19',
    'Aditya Verma',
    '10000000-0000-0000-0000-000000000009',
    'Senior Full Stack Developer',
    '00000000-0000-0000-0000-000000000003',
    68,
    'Needs Review',
    3,
    2,
    7,
    65,
    'REVIEW',
    NOW() - INTERVAL '1 hour',
    '{"full_name": "Aditya Verma", "targetRole": "Senior Full Stack Developer", "fitScore": 68}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    fit_score = EXCLUDED.fit_score,
    recommendation = EXCLUDED.recommendation,
    recruiter_action = EXCLUDED.recruiter_action;

-- ----------------------------------------------------------------------------
-- 15. Validation Queries (Verify Seed Success)
-- ----------------------------------------------------------------------------
-- SELECT COUNT(*) AS total_jobs FROM public.job_openings;
-- SELECT COUNT(*) AS demo_candidates FROM public.candidates WHERE is_demo = true;
-- SELECT COUNT(*) AS demo_screenings FROM public.screenings;
-- SELECT COUNT(*) AS shortlisted_decisions FROM public.recruiter_decisions WHERE decision = 'shortlisted';
