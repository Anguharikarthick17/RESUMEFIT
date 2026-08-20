import type { AnalysisResponse, ExtractedField } from './resume'
import type { JobOpening } from './recruiter'

export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'interview' | 'rejected' | 'withdrawn'

export interface JobMatchItem {
  job_id: string
  job_title: string
  department: string | null
  location: string | null
  fit_score: number
  status_label: 'Strong Match' | 'Needs Review' | 'Low Fit'
  matched_requirements: string[]
  partial_requirements: string[]
  missing_requirements: string[]
  requirements: any[]
}

export interface JobApplicationItem {
  id: string
  job_id: string
  candidate_id: string
  resume_id?: string
  fit_score: number
  raw_score?: number
  status: ApplicationStatus
  applied_at: string
  updated_at: string
  jobs?: JobOpening
}

export interface CandidateAccount {
  id: string
  name: string
  email: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  summary: string | null
  education: any[]
  experience: any[]
  skills: string[]
  certifications: any[]
  projects: any[]
  resume_id?: string
  resume_filename?: string
  resume_fields?: ExtractedField[]
  raw_analysis?: AnalysisResponse
}
