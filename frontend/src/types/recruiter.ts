import type { AnalysisResponse } from './resume'
import type { EnhancedRequirementMatch, JobReadinessScore, ShortlistRecommendation, WeightedFitScore } from './intelligence'

export type RecruiterDecisionStatus = 'UNDECIDED' | 'SHORTLISTED' | 'REVIEW' | 'REJECTED'

export interface JobOpening {
  id: string
  title: string
  department: string
  location: string
  experience_level: string
  job_description: string
  status: 'ACTIVE' | 'ARCHIVED'
  created_at: string
  candidates_count: number
  strong_matches_count: number
  shortlisted_count: number
}

export interface RankedCandidate {
  id: string
  rank: number
  filename: string
  candidateName: string
  email: string | null
  phone: string | null
  location: string | null
  highestDegree: string | null
  mostRecentRole: string | null
  rawFitScore: number
  weightedFitScore: number
  criticalMatched: number
  criticalTotal: number
  experienceSummary: string
  evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW'
  aiRecommendation: 'STRONG MATCH' | 'REVIEW' | 'LOW FIT'
  recruiterDecision: RecruiterDecisionStatus
  reviewFlags: string[]
  data: AnalysisResponse
  weightedScoreObj: WeightedFitScore
  readinessScoreObj: JobReadinessScore
  enhancedReqs: EnhancedRequirementMatch[]
  shortlistRec: ShortlistRecommendation
}

export interface ScreeningSession {
  sessionId: string
  job: JobOpening
  candidates: RankedCandidate[]
  totalUploaded: number
  successfulCount: number
  failedCount: number
  created_at: string
}
