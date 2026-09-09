// Supabase Data Service — Single Source of Truth for Localhost & Production
// Replaces all local/mock/static data dependencies with Supabase

import { supabase, isSupabaseClientEnabled } from './supabaseClient'
import type { JobOpening, RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'
import type { AnalysisSnapshot } from '../types/intelligence'
import type { AnalysisResponse, RequirementMatch, ExtractedField } from '../types/resume'
import {
  computeEnhancedRequirements,
  computeJobReadinessScore,
  evaluateRecruiterShortlist,
  generateAnalysisId,
} from '../utils/intelligenceEngine'

export interface SupabaseStatus {
  isConfigured: boolean
  isConnected: boolean
  errorMessage: string | null
}

/**
 * Check Supabase connectivity & configuration
 */
export async function checkSupabaseStatus(): Promise<SupabaseStatus> {
  if (!isSupabaseClientEnabled() || !supabase) {
    return {
      isConfigured: false,
      isConnected: false,
      errorMessage:
        'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing or set to placeholder values.',
    }
  }

  try {
    const { error } = await supabase.from('job_openings').select('id', { count: 'exact', head: true })
    if (error) {
      return {
        isConfigured: true,
        isConnected: false,
        errorMessage: `Supabase database error: ${error.message} (Code: ${error.code}). Ensure migration/seed has been applied.`,
      }
    }
    return {
      isConfigured: true,
      isConnected: true,
      errorMessage: null,
    }
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      errorMessage: `Network error connecting to Supabase: ${err?.message || err}`,
    }
  }
}

/**
 * Fetch all Active Job Openings from Supabase with dynamic applicant/match/shortlist counts
 */
export async function fetchJobOpeningsFromSupabase(): Promise<JobOpening[]> {
  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }

  // 1. Fetch active job openings
  const { data: jobsData, error: jobsError } = await supabase
    .from('job_openings')
    .select('*')
    .ilike('status', 'active')
    .order('created_at', { ascending: false })

  if (jobsError) {
    console.error('[Supabase] Error fetching job openings:', jobsError)
    throw new Error(`Failed to load job openings from Supabase: ${jobsError.message}`)
  }

  if (!jobsData || jobsData.length === 0) {
    return []
  }

  // 2. Fetch all screenings to compute relational counts per job
  const { data: screeningsData, error: screeningsError } = await supabase
    .from('screenings')
    .select('id, job_opening_id, fit_score, review_status')

  if (screeningsError) {
    console.warn('[Supabase] Warning: Could not fetch screening counts:', screeningsError)
  }

  const countsByJob: Record<
    string,
    { total: number; strongMatches: number; needsReview: number; shortlisted: number }
  > = {}

  if (screeningsData) {
    for (const sc of screeningsData) {
      const jid = sc.job_opening_id
      if (!countsByJob[jid]) {
        countsByJob[jid] = { total: 0, strongMatches: 0, needsReview: 0, shortlisted: 0 }
      }
      countsByJob[jid].total += 1
      if (sc.fit_score >= 80) {
        countsByJob[jid].strongMatches += 1
      } else if (sc.fit_score >= 50 && sc.fit_score < 80) {
        countsByJob[jid].needsReview += 1
      }
      if (sc.review_status === 'shortlisted') {
        countsByJob[jid].shortlisted += 1
      }
    }
  }

  // 3. Map into JobOpening objects
  return jobsData.map((job: any) => {
    const counts = countsByJob[job.id] || { total: 0, strongMatches: 0, needsReview: 0, shortlisted: 0 }
    return {
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      work_mode: job.work_mode || 'Hybrid',
      experience_level: job.experience_level || 'Mid–Senior',
      job_description: job.description || job.job_description || '',
      requirements: job.requirements || '',
      status: (job.status || 'Active').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'ARCHIVED',
      created_at: job.created_at || new Date().toISOString(),
      candidates_count: counts.total,
      strong_matches_count: counts.strongMatches,
      needs_review_count: counts.needsReview,
      shortlisted_count: counts.shortlisted,
    }
  })
}

/**
 * Create a New Job Opening in Supabase
 */
export async function createJobOpeningInSupabase(job: {
  title: string
  department: string
  location: string
  work_mode?: string
  experience_level?: string
  description: string
  requirements?: string
}): Promise<JobOpening> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const newRecord = {
    title: job.title.trim(),
    department: job.department.trim(),
    location: job.location.trim(),
    work_mode: job.work_mode?.trim() || 'Hybrid',
    experience_level: job.experience_level?.trim() || 'Mid–Senior',
    description: job.description.trim(),
    requirements: job.requirements?.trim() || 'General requirements',
    status: 'Active',
  }

  const { data, error } = await supabase
    .from('job_openings')
    .insert([newRecord])
    .select()
    .single()

  if (error) {
    console.error('[Supabase] Error creating job opening:', error)
    throw new Error(`Failed to create job opening: ${error.message}`)
  }

  return {
    id: data.id,
    title: data.title,
    department: data.department,
    location: data.location,
    work_mode: data.work_mode,
    experience_level: data.experience_level,
    job_description: data.description,
    requirements: data.requirements,
    status: 'ACTIVE',
    created_at: data.created_at,
    candidates_count: 0,
    strong_matches_count: 0,
    shortlisted_count: 0,
  }
}

/**
 * Fetch Ranked Candidates for a Job from Supabase
 */
export async function fetchJobCandidatesFromSupabase(jobId: string): Promise<RankedCandidate[]> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.')
  }

  const { data, error } = await supabase
    .from('screenings')
    .select(`
      id,
      candidate_id,
      job_opening_id,
      fit_score,
      status,
      recommendation,
      review_status,
      evidence,
      requirements,
      screened_at,
      candidates (
        id,
        name,
        email,
        phone,
        location,
        linkedin_url,
        highest_degree,
        most_recent_role,
        skills,
        experience,
        summary
      )
    `)
    .eq('job_opening_id', jobId)
    .order('fit_score', { ascending: false })

  if (error) {
    console.error('[Supabase] Error fetching candidates for job:', error)
    throw new Error(`Failed to load candidates from Supabase: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((item: any, idx: number) => {
    const cand = item.candidates || {}
    const candName = cand.name || 'Candidate'
    const evidenceFields: ExtractedField[] = Array.isArray(item.evidence) ? item.evidence : []
    const reqList: RequirementMatch[] = Array.isArray(item.requirements) ? item.requirements : []

    const skillsArray = typeof cand.skills === 'string'
      ? cand.skills.split(',').map((s: string) => s.trim())
      : Array.isArray(cand.skills)
      ? cand.skills
      : []

    const analysisResp: AnalysisResponse = {
      candidate: {
        full_name: candName,
        email: cand.email || null,
        phone: cand.phone || null,
        location: cand.location || null,
        linkedin_url: cand.linkedin_url || null,
        highest_degree: cand.highest_degree || null,
        most_recent_role: cand.most_recent_role || null,
        skills: skillsArray,
      },
      fields: evidenceFields,
      sections_found: ['Contact', 'Experience', 'Education', 'Skills'],
      requirements: reqList,
      fit_score: {
        fit_score: typeof item.fit_score === 'number' ? item.fit_score : 0,
        score_label: item.fit_score >= 80 ? 'Strong Match' : 'Needs Review',
        matched: reqList.filter((r) => r.match_status === 'MATCHED').length,
        partial: reqList.filter((r) => r.match_status === 'PARTIAL').length,
        missing: reqList.filter((r) => r.match_status === 'MISSING').length,
        total: reqList.length,
      },
      errors: [],
    }

    const enhanced = computeEnhancedRequirements(reqList)
    const readiness = computeJobReadinessScore(evidenceFields, reqList)
    const shortlistRec = evaluateRecruiterShortlist(analysisResp)

    let recruiterDecision: RecruiterDecisionStatus = 'UNDECIDED'
    if (item.review_status === 'shortlisted') recruiterDecision = 'SHORTLISTED'
    else if (item.review_status === 'review') recruiterDecision = 'REVIEW'
    else if (item.review_status === 'rejected') recruiterDecision = 'REJECTED'

    const reviewFlags: string[] = []
    if (!cand.phone) reviewFlags.push('Candidate contact phone not found in text.')
    if (!cand.highest_degree) reviewFlags.push('Formal university degree not listed.')
    if (!cand.most_recent_role) reviewFlags.push('Full-time professional title not explicitly detected.')

    let evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
    if (item.fit_score < 50) evidenceQuality = 'LOW'
    else if (item.fit_score < 75) evidenceQuality = 'MEDIUM'

    let aiRecommendation: 'STRONG MATCH' | 'REVIEW' | 'LOW FIT' = 'REVIEW'
    if (item.fit_score >= 80) aiRecommendation = 'STRONG MATCH'
    else if (item.fit_score < 50) aiRecommendation = 'LOW FIT'

    return {
      id: item.id,
      rank: idx + 1,
      filename: `${candName.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`,
      candidateName: candName,
      name: candName,
      email: cand.email || null,
      phone: cand.phone || null,
      location: cand.location || null,
      highestDegree: cand.highest_degree || null,
      mostRecentRole: cand.most_recent_role || null,
      rawFitScore: item.fit_score,
      weightedFitScore: item.fit_score,
      fitScore: item.fit_score,
      criticalMatched: reqList.filter((r) => r.match_status === 'MATCHED').length,
      criticalTotal: reqList.length,
      criticalRequirementsMet: reqList.filter((r) => r.match_status === 'MATCHED').length,
      criticalRequirementsTotal: reqList.length,
      experienceSummary: cand.most_recent_role || cand.experience || 'Experienced Professional',
      currentTitle: cand.role || cand.most_recent_role || 'Engineer',
      evidenceQuality,
      evidenceStrength: evidenceQuality === 'HIGH' ? 'STRONG' : evidenceQuality === 'MEDIUM' ? 'MODERATE' : 'LOW',
      aiRecommendation,
      recruiterDecision,
      reviewFlags,
      flags: reviewFlags.map((rf) => ({ title: rf })),
      skills: skillsArray,
      data: analysisResp,
      weightedScoreObj: enhanced.weighted,
      readinessScoreObj: readiness,
      enhancedReqs: enhanced.enhanced,
      shortlistRec,
    }
  })
}

/**
 * Persist Recruiter Decision to Supabase
 */
export async function persistCandidateDecisionToSupabase(
  screeningId: string,
  decision: RecruiterDecisionStatus,
  notes?: string,
): Promise<boolean> {
  if (!supabase) return false

  const statusVal = decision.toLowerCase()

  try {
    // 1. Update screening record review_status
    const { error: screeningErr } = await supabase
      .from('screenings')
      .update({ review_status: statusVal, updated_at: new Date().toISOString() })
      .eq('id', screeningId)

    if (screeningErr) {
      console.error('[Supabase] Error updating screening status:', screeningErr)
    }

    // 2. Upsert recruiter_decisions record
    const { error: decisionErr } = await supabase
      .from('recruiter_decisions')
      .upsert(
        {
          screening_id: screeningId,
          decision: statusVal,
          notes: notes || null,
          decided_at: new Date().toISOString(),
        },
        { onConflict: 'screening_id' },
      )

    if (decisionErr) {
      console.error('[Supabase] Error saving recruiter decision:', decisionErr)
    }

    return !screeningErr
  } catch (err) {
    console.error('[Supabase] Decision persistence failed:', err)
    return false
  }
}

/**
 * Fetch Screening History from Supabase
 */
export async function fetchScreeningHistoryFromSupabase(): Promise<AnalysisSnapshot[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('screening_history')
    .select('*')
    .order('screened_at', { ascending: false })

  if (error) {
    console.error('[Supabase] Error fetching screening history:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    analysisId: row.analysis_id,
    timestamp: row.screened_at,
    candidateName: row.candidate_name,
    targetRole: row.job_title,
    fitScore: row.fit_score,
    recommendation: row.recommendation,
    jobReadiness: row.job_readiness || 85,
    matchedCount: row.matched_count,
    missingCount: row.missing_count,
    totalRequirements: row.total_requirements,
    data: row.data || {},
  }))
}

/**
 * Save Analysis Snapshot to Supabase History
 */
export async function saveAnalysisSnapshotToSupabase(snapshot: AnalysisSnapshot): Promise<void> {
  if (!supabase) return

  try {
    await supabase.from('screening_history').insert([
      {
        analysis_id: snapshot.analysisId,
        candidate_name: snapshot.candidateName,
        job_title: snapshot.targetRole,
        fit_score: snapshot.fitScore,
        recommendation: snapshot.recommendation,
        matched_count: snapshot.matchedCount,
        missing_count: snapshot.missingCount,
        total_requirements: snapshot.totalRequirements,
        job_readiness: snapshot.jobReadiness,
        recruiter_action: 'UNDECIDED',
        screened_at: snapshot.timestamp || new Date().toISOString(),
        data: snapshot.data,
      },
    ])
  } catch (err) {
    console.warn('[Supabase] Could not persist history snapshot:', err)
  }
}

/**
 * Delete Analysis Snapshot from Supabase History
 */
export async function deleteAnalysisSnapshotFromSupabase(analysisId: string): Promise<void> {
  if (!supabase) return

  try {
    await supabase.from('screening_history').delete().eq('analysis_id', analysisId)
  } catch (err) {
    console.warn('[Supabase] Error deleting history snapshot:', err)
  }
}
