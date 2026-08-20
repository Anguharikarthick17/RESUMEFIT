// ResumeFit Intelligence Types — Supporting Candidates & Recruiters

import type { AnalysisResponse, CandidateProfile, ExtractedField, MatchStatus, RequirementMatch } from './resume'

export type UserMode = 'candidate' | 'recruiter'

export type RequirementPriority = 'CRITICAL' | 'IMPORTANT' | 'NICE_TO_HAVE'

export interface EnhancedRequirementMatch extends RequirementMatch {
  priority: RequirementPriority
  weight: number
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface WeightedFitScore {
  raw_score: number
  weighted_score: number
  score_label: string
  critical_matched: number
  critical_total: number
  important_matched: number
  important_total: number
  nice_matched: number
  nice_total: number
  explanation: string
}

export interface JobReadinessScore {
  overall: number
  technical_skills: number
  education: number
  projects: number
  experience: number
  certifications: number
  label: string
}

export interface SkillGapItem {
  skill: string
  status: MatchStatus
  required_by: string
  evidence_field: string | null
  evidence_text: string | null
  category: string
}

export interface LearningRoadmapGoal {
  week: number
  title: string
  skill: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimated_hours: number
  reason: string
  recommended_focus: string[]
}

export interface ImprovementOption {
  id: string
  label: string
  skill_or_area: string
  category: 'skill' | 'project' | 'certification' | 'experience'
  estimated_impact_pts: number
  requirement_matched: string
}

export interface SimulationResult {
  selected_ids: string[]
  current_fit: number
  projected_fit: number
  delta: number
  new_matched_count: number
  new_partial_count: number
  new_missing_count: number
  applied_improvements: { label: string; impact: number; requirement: string }[]
}

export interface ClaimStrengthItem {
  claim: string
  extracted_skill_or_term: string
  quality: 'Strong' | 'Moderate' | 'Weak' | 'Not Found'
  evidence_quote: string | null
  status_explanation: string
}

export interface RoleFitResult {
  role_id: string
  role_title: string
  fit_score: number
  strong_areas: string[]
  missing_skills: string[]
  is_best_fit?: boolean
}

export interface AssessmentQuestion {
  id: string
  category: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

export interface AssessmentResult {
  category: string
  score: number
  total: number
  percentage: number
  claim_status: string
  combined_status: string
  completed_at: string
}

export interface ShortlistRecommendation {
  decision: 'SHORTLIST' | 'REVIEW' | 'LOW_FIT'
  headline: string
  reasons: string[]
  concerns: string[]
  fit_rating: string
}

export interface AnalysisSnapshot {
  analysisId: string
  timestamp: string
  candidateName: string
  candidateEmail: string | null
  targetRole: string
  fitScore: number
  weightedScore: number
  jobReadiness: number
  matchedCount: number
  partialCount: number
  missingCount: number
  totalRequirements: number
  data: AnalysisResponse
}
