// ResumeFit API types — mirror backend Pydantic models exactly

export type FieldStatus = 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS'
export type MatchStatus = 'MATCHED' | 'PARTIAL' | 'MISSING'
export type Confidence = 'high' | 'medium' | 'low'

export interface ExtractedField {
  field_id: string
  category: string
  status: FieldStatus
  value: string | null
  evidence: string | null
  source_section: string | null
  reason: string | null
}

export interface RequirementMatch {
  requirement: string
  match_status: MatchStatus
  explanation: string
  evidence_ref: string | null
  confidence: Confidence
}

export interface FitScore {
  fit_score: number
  score_label: string
  matched: number
  partial: number
  missing: number
  total: number
}

export interface CandidateProfile {
  full_name: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  highest_degree: string | null
  most_recent_role: string | null
  location: string | null
}

export interface AnalysisResponse {
  candidate: CandidateProfile
  fields: ExtractedField[]
  sections_found: string[]
  requirements: RequirementMatch[]
  fit_score: FitScore
  errors: string[]
}

export interface AnalysisError {
  code: string
  message: string
}

export type AppState =
  | { phase: 'landing' }
  | { phase: 'analyze' }
  | { phase: 'processing'; progress: number; step: string }
  | { phase: 'results'; data: AnalysisResponse }
  | { phase: 'error'; error: AnalysisError }
