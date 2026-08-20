// Recruiter Store & Data Management

import type { AnalysisResponse } from '../types/resume'
import type { JobOpening, RankedCandidate, RecruiterDecisionStatus, ScreeningSession } from '../types/recruiter'
import {
  computeEnhancedRequirements,
  computeJobReadinessScore,
  evaluateRecruiterShortlist,
  generateAnalysisId,
} from './intelligenceEngine'

const JOBS_STORAGE_KEY = 'resumefit_recruiter_jobs_v1'
const SESSIONS_STORAGE_KEY = 'resumefit_recruiter_sessions_v1'
const DECISIONS_STORAGE_KEY = 'resumefit_recruiter_decisions_v1'

export const DEFAULT_JOBS: JobOpening[] = [
  {
    id: 'job-aiml-eng',
    title: 'AI / Machine Learning Engineer',
    department: 'Engineering & Data',
    location: 'San Francisco, CA (Hybrid)',
    experience_level: 'Mid-Senior (2+ years)',
    job_description: `AI/ML Engineer

Responsibilities:
- Build, train, and deploy machine learning models using Python.
- Develop data pipelines and query structured relational databases using SQL.
- Deploy scalable AI services using Docker and cloud infrastructure.

Requirements:
- Strong proficiency in Python and Machine Learning libraries.
- Experience with SQL and relational database queries.
- Minimum 2+ years experience building ML projects or production software.
- Experience with AWS or cloud deployment is a plus.`,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    candidates_count: 6,
    strong_matches_count: 3,
    shortlisted_count: 2,
  },
  {
    id: 'job-java-backend',
    title: 'Java Software Engineer',
    department: 'Backend Platform',
    location: 'Remote / US',
    experience_level: 'Fresher / Mid',
    job_description: `Java Software Engineer

Responsibilities:
- Develop microservices and REST APIs using Java and Spring Boot.
- Utilize Git and GitHub for collaborative version control.
- Write clean unit tests and database queries.

Requirements:
- Bachelor's degree in Computer Science or related technical field.
- Proficiency in Java and Spring Boot frameworks.
- Experience building RESTful APIs and SQL databases.
- Familiarity with Git version control.`,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    candidates_count: 4,
    strong_matches_count: 2,
    shortlisted_count: 1,
  },
  {
    id: 'job-fullstack',
    title: 'Senior Full Stack Developer',
    department: 'Core Product',
    location: 'New York, NY',
    experience_level: 'Senior (4+ years)',
    job_description: `Senior Full Stack Developer

Requirements:
- 4+ years building production web applications with React and TypeScript.
- Strong Node.js or Python backend service development.
- PostgreSQL database design and query optimization.
- Experience with Docker, Kubernetes, and CI/CD pipelines.`,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    candidates_count: 0,
    strong_matches_count: 0,
    shortlisted_count: 0,
  },
]

export function getStoredJobOpenings(): JobOpening[] {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(DEFAULT_JOBS))
      return DEFAULT_JOBS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_JOBS
  }
}

export function saveJobOpening(job: JobOpening): void {
  try {
    const jobs = getStoredJobOpenings()
    const updated = [job, ...jobs.filter((j) => j.id !== job.id)]
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}

export function getStoredDecisions(): Record<string, RecruiterDecisionStatus> {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveRecruiterDecision(candidateId: string, decision: RecruiterDecisionStatus): void {
  try {
    const decisions = getStoredDecisions()
    decisions[candidateId] = decision
    localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(decisions))
  } catch {
    /* ignore */
  }
}

export function transformAnalysisToRankedCandidate(
  filename: string,
  data: AnalysisResponse,
  index: number,
): RankedCandidate {
  const enhanced = computeEnhancedRequirements(data.requirements)
  const readiness = computeJobReadinessScore(data.fields, data.requirements)
  const shortlistRec = evaluateRecruiterShortlist(data)
  const decisions = getStoredDecisions()

  const candidateId = generateAnalysisId(data, filename)
  const name = data.candidate.full_name || filename.replace(/\.(pdf|docx)$/i, '')

  // Generate Review Flags (Objective, non-accusatory flags)
  const reviewFlags: string[] = []
  if (data.candidate.phone === null) reviewFlags.push('Candidate contact phone not found in text.')
  if (data.candidate.highest_degree === null) reviewFlags.push('Formal university degree not listed.')
  if (data.candidate.most_recent_role === null) reviewFlags.push('Full-time professional title not explicitly detected.')
  if (data.fit_score.missing > 0) reviewFlags.push(`${data.fit_score.missing} requirement(s) have zero extracted evidence.`)
  if (data.fit_score.partial > 0) reviewFlags.push(`${data.fit_score.partial} requirement(s) are partially supported.`)

  let evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
  if (data.fit_score.fit_score < 50) evidenceQuality = 'LOW'
  else if (data.fit_score.fit_score < 75) evidenceQuality = 'MEDIUM'

  let aiRecommendation: 'STRONG MATCH' | 'REVIEW' | 'LOW FIT' = 'REVIEW'
  if (enhanced.weighted.weighted_score >= 80) aiRecommendation = 'STRONG MATCH'
  else if (enhanced.weighted.weighted_score < 50) aiRecommendation = 'LOW FIT'

  const recruiterDecision = decisions[candidateId] || 'UNDECIDED'

  return {
    id: candidateId,
    rank: index + 1,
    filename,
    candidateName: name,
    email: data.candidate.email,
    phone: data.candidate.phone,
    location: data.candidate.location,
    highestDegree: data.candidate.highest_degree,
    mostRecentRole: data.candidate.most_recent_role,
    rawFitScore: data.fit_score.fit_score,
    weightedFitScore: enhanced.weighted.weighted_score,
    criticalMatched: enhanced.weighted.critical_matched,
    criticalTotal: enhanced.weighted.critical_total,
    experienceSummary: data.candidate.most_recent_role || 'Fresher / Project Experience',
    evidenceQuality,
    aiRecommendation,
    recruiterDecision,
    reviewFlags,
    data,
    weightedScoreObj: enhanced.weighted,
    readinessScoreObj: readiness,
    enhancedReqs: enhanced.enhanced,
    shortlistRec,
  }
}

export function rankCandidates(candidates: RankedCandidate[]): RankedCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    // 1. Primary: Weighted Fit Score descending
    if (b.weightedFitScore !== a.weightedFitScore) {
      return b.weightedFitScore - a.weightedFitScore
    }
    // 2. Secondary: Critical matched count descending
    if (b.criticalMatched !== a.criticalMatched) {
      return b.criticalMatched - a.criticalMatched
    }
    // 3. Tertiary: Raw Fit Score
    if (b.rawFitScore !== a.rawFitScore) {
      return b.rawFitScore - a.rawFitScore
    }
    // 4. Stable tie-break by candidate name/id
    return a.candidateName.localeCompare(b.candidateName)
  })

  // Assign deterministic rank
  return sorted.map((c, idx) => ({ ...c, rank: idx + 1 }))
}
