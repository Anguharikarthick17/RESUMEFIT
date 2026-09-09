// ResumeFit API Client — Full Screening & Candidate Portal Integration

import type { AnalysisResponse, AnalysisError } from '../types/resume'
import type { JobOpening, RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'
import type { CandidateAccount, JobApplicationItem, JobMatchItem } from '../types/candidate'
import { transformAnalysisToRankedCandidate } from '../utils/recruiterStore'

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/$/, '')


export interface ScreeningSessionResponse {
  job: JobOpening
  session_id: string
  total_processed: number
  candidates: {
    id: string
    candidate_id: string
    candidate_name: string
    fit_score: number
    critical_met: number
    matched_count: number
    rank: number
    data: AnalysisResponse
    storage_path?: string
  }[]
}

/**
 * Health & Supabase Status
 */
export async function checkBackendHealth(): Promise<{ status: string; service: string; supabase_connected: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) throw new Error('Health check failed')
    return await res.json()
  } catch {
    return { status: 'offline', service: 'resumefit', supabase_connected: false }
  }
}

/**
 * Single Resume Analysis
 */
export async function analyzeResume(
  file: File,
  jobDescription: string,
  onProgress?: (step: string, progress: number) => void,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {


  onProgress?.('Uploading resume...', 15)

  const formData = new FormData()
  formData.append('resume', file)
  formData.append('job_description', jobDescription)

  let response: Response
  try {
    onProgress?.('Processing resume and extracting sections...', 45)
    response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      body: formData,
      signal,
      cache: 'no-store',
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw { code: 'ABORTED', message: 'Request was cancelled.' }
    }
    throw {
      code: 'NETWORK_ERROR',
      message: 'Unable to reach ResumeFit backend at http://localhost:8000.',
    }
  }

  onProgress?.('Matching requirements and scoring...', 80)

  if (!response.ok) {
    let errBody: any
    try {
      errBody = await response.json()
    } catch {
      errBody = { detail: { code: 'HTTP_ERROR', message: `Server returned status ${response.status}` } }
    }
    const detail = errBody?.detail || {}
    throw {
      code: detail.code || 'UNKNOWN_ERROR',
      message: detail.message || (typeof errBody?.detail === 'string' ? errBody.detail : 'Analysis failed.'),
    }
  }

  const data: AnalysisResponse = await response.json()
  onProgress?.('Done!', 100)
  return data
}

/**
 * Candidate Master Resume Upload (POST /api/candidates/resume)
 */
export async function uploadCandidateMasterResume(
  file: File,
  onProgress?: (step: string, progress: number) => void,
): Promise<{
  candidate: any
  resume_id: string
  is_duplicate: boolean
  profile: any
  fields: any[]
}> {
  onProgress?.('Uploading resume to candidate profile...', 20)

  const formData = new FormData()
  formData.append('resume', file)

  let response: Response
  try {
    onProgress?.('Extracting structured profile fields with AI engine...', 60)
    response = await fetch(`${API_BASE}/api/candidates/resume`, {
      method: 'POST',
      body: formData,
    })
  } catch (err) {
    throw { code: 'NETWORK_ERROR', message: 'Failed to upload candidate resume.' }
  }

  if (!response.ok) {
    throw { code: 'UPLOAD_ERROR', message: 'Resume extraction failed.' }
  }

  onProgress?.('Profile parsed successfully!', 100)
  return await response.json()
}

/**
 * Fetch Candidate Matches across all active jobs (GET /api/candidates/{id}/matches)
 */
export async function fetchCandidateMatches(candidateId: string): Promise<JobMatchItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/matches`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

/**
 * Candidate Applies to a Job (POST /api/jobs/{job_id}/apply)
 */
export async function submitCandidateApplication(
  jobId: string,
  candidateId: string,
  resumeId?: string,
): Promise<{ application: JobApplicationItem; already_applied: boolean }> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: candidateId,
      resume_id: resumeId,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to submit application.')
  }

  return await res.json()
}

/**
 * Fetch Candidate's Submitted Applications (GET /api/candidates/{id}/applications)
 */
export async function fetchCandidateApplications(candidateId: string): Promise<JobApplicationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/applications`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

/**
 * Master Multi-Resume Screening API (POST /api/screening)
 */
export async function runScreeningSession(
  files: File[],
  jobTitle: string,
  jobDescription: string,
  department?: string,
  location?: string,
  onProgress?: (step: string, progress: number) => void,
  signal?: AbortSignal,
): Promise<{ job: JobOpening; candidates: RankedCandidate[] }> {
  onProgress?.(`Uploading ${files.length} candidate resumes to screening engine...`, 20)

  const formData = new FormData()
  for (const f of files) {
    formData.append('resumes', f)
  }
  formData.append('job_title', jobTitle)
  formData.append('job_description', jobDescription)
  if (department) formData.append('department', department)
  if (location) formData.append('location', location)

  let response: Response
  try {
    onProgress?.(`Extracting text and scoring ${files.length} candidates with Supabase...`, 60)
    response = await fetch(`${API_BASE}/api/screening`, {
      method: 'POST',
      body: formData,
      signal,
      cache: 'no-store',
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw { code: 'ABORTED', message: 'Screening request cancelled.' }
    }
    throw {
      code: 'NETWORK_ERROR',
      message: 'Unable to reach ResumeFit screening engine at http://localhost:8000.',
    }
  }

  if (!response.ok) {
    throw {
      code: 'SCREENING_ERROR',
      message: 'Screening execution failed.',
    }
  }

  onProgress?.('Finalizing deterministic candidate rankings...', 90)
  const raw: ScreeningSessionResponse = await response.json()

  const rankedCandidates: RankedCandidate[] = raw.candidates.map((item, idx) => {
    const r = transformAnalysisToRankedCandidate(item.candidate_name, item.data, idx)
    r.id = item.id
    r.rank = item.rank
    return r
  })

  onProgress?.('Screening complete!', 100)
  return {
    job: raw.job,
    candidates: rankedCandidates,
  }
}

import {
  fetchJobOpeningsFromSupabase,
  fetchJobCandidatesFromSupabase,
  persistCandidateDecisionToSupabase,
} from './supabaseService'

/**
 * Fetch Jobs from Supabase (Single Source of Truth)
 */
export async function fetchJobsList(): Promise<JobOpening[]> {
  return await fetchJobOpeningsFromSupabase()
}

/**
 * Fetch Active Jobs for Candidate Marketplace (from Supabase)
 */
export async function fetchActiveJobs(): Promise<JobOpening[]> {
  return await fetchJobOpeningsFromSupabase()
}

/**
 * Fetch Candidates for a Job from Supabase
 */
export async function fetchJobCandidates(jobId: string): Promise<RankedCandidate[]> {
  return await fetchJobCandidatesFromSupabase(jobId)
}

/**
 * Persist Recruiter Decision to Supabase
 */
export async function persistRecruiterDecision(
  screeningResultId: string,
  decision: RecruiterDecisionStatus,
  notes?: string,
): Promise<boolean> {
  return await persistCandidateDecisionToSupabase(screeningResultId, decision, notes)
}

export const analyzeResumeApi = analyzeResume

