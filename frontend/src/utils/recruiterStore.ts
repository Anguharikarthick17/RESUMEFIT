// Recruiter Store & Data Transformation
// Production data is sourced directly from Supabase (see supabaseService.ts)

import type { AnalysisResponse } from '../types/resume'
import type { JobOpening, RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'
import {
  computeEnhancedRequirements,
  computeJobReadinessScore,
  evaluateRecruiterShortlist,
  generateAnalysisId,
} from './intelligenceEngine'

export function transformAnalysisToRankedCandidate(
  filename: string,
  data: AnalysisResponse,
  index: number,
  recruiterDecision: RecruiterDecisionStatus = 'UNDECIDED',
): RankedCandidate {

  const enhanced = computeEnhancedRequirements(data.requirements)
  const readiness = computeJobReadinessScore(data.fields, data.requirements)
  const shortlistRec = evaluateRecruiterShortlist(data)

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

  const skillsList = data.candidate.skills ||
    (data.fields.find((f) => f.field_id === 'SKILLS-LIST')?.value?.split(',').map((s) => s.trim()) || [])



  return {
    id: candidateId,
    rank: index + 1,
    filename,
    candidateName: name,
    name: name,
    email: data.candidate.email,
    phone: data.candidate.phone,
    location: data.candidate.location,
    highestDegree: data.candidate.highest_degree,
    mostRecentRole: data.candidate.most_recent_role,
    rawFitScore: data.fit_score.fit_score,
    weightedFitScore: enhanced.weighted.weighted_score,
    fitScore: data.fit_score.fit_score,
    criticalMatched: enhanced.weighted.critical_matched,
    criticalTotal: enhanced.weighted.critical_total,
    criticalRequirementsMet: enhanced.weighted.critical_matched,
    criticalRequirementsTotal: enhanced.weighted.critical_total,
    experienceSummary: data.candidate.most_recent_role || 'Fresher / Project Experience',
    currentTitle: data.candidate.most_recent_role || 'Candidate',
    evidenceQuality,
    evidenceStrength: evidenceQuality === 'HIGH' ? 'STRONG' : evidenceQuality === 'MEDIUM' ? 'MODERATE' : 'LOW',
    aiRecommendation,
    recruiterDecision,
    reviewFlags,
    flags: reviewFlags.map((rf) => ({ title: rf })),
    skills: skillsList,
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
