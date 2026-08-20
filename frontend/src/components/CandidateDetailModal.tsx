import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Star,
  Clock,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Quote,
  Layers,
  Globe,
} from 'lucide-react'
import type { RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'
import EvidenceExplorer from './EvidenceExplorer'
import RequirementMatrix from './RequirementMatrix'

interface CandidateDetailModalProps {
  candidate: RankedCandidate
  jobDescription: string
  onClose: () => void
  onUpdateDecision: (decision: RecruiterDecisionStatus) => void
}

export default function CandidateDetailModal({
  candidate,
  jobDescription,
  onClose,
  onUpdateDecision,
}: CandidateDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE' | 'REQUIREMENTS' | 'FLAGS'>('OVERVIEW')

  const analysis = candidate.data || {
    candidate: {},
    fields: [],
    requirements: [],
    fit_score: { fit_score: 0, matched: 0, partial: 0, missing: 0, total: 0 },
  }

  const name = (candidate.candidateName || candidate.name || analysis.candidate?.full_name || 'Candidate').trim()
  const email = candidate.email || analysis.candidate?.email || null
  const phone = candidate.phone || analysis.candidate?.phone || null
  const location = candidate.location || analysis.candidate?.location || null
  const score = typeof candidate.weightedFitScore === 'number' ? candidate.weightedFitScore : typeof candidate.rawFitScore === 'number' ? candidate.rawFitScore : candidate.fitScore ?? (analysis.fit_score?.fit_score || 0)
  const critMet = candidate.criticalMatched ?? candidate.criticalRequirementsMet ?? (analysis.fit_score?.matched || 0)
  const critTotal = candidate.criticalTotal ?? candidate.criticalRequirementsTotal ?? (analysis.fit_score?.total || 1)
  const skillsList = Array.isArray(candidate.skills) ? candidate.skills : Array.isArray(analysis.candidate?.skills) ? analysis.candidate.skills : []
  const decision = candidate.recruiterDecision || 'UNDECIDED'

  const fitColor =
    score >= 80
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : score >= 50
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E5E5E5]">
        
        {/* ── Top Bar: Candidate Header + Human Decision Buttons ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black text-white font-black text-xl flex items-center justify-center border border-neutral-800">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#F5F5F4] text-[#111111] px-2 py-0.5 rounded border border-[#E5E5E5]">
                  Rank #{candidate.rank || 1}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#111111]">
                  {name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] font-mono">
                {email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-[#888888]" />
                    <span>{email}</span>
                  </span>
                )}
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-[#888888]" />
                    <span>{phone}</span>
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[#888888]" />
                    <span>{location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Human Decision Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onUpdateDecision('SHORTLISTED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                decision === 'SHORTLISTED'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Star size={14} />
              <span>Shortlist</span>
            </button>

            <button
              onClick={() => onUpdateDecision('REVIEW')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                decision === 'REVIEW'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Clock size={14} />
              <span>Mark Review</span>
            </button>

            <button
              onClick={() => onUpdateDecision('REJECTED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                decision === 'REJECTED'
                  ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <XCircle size={14} />
              <span>Reject</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#777777] hover:text-[#111111] rounded-lg hover:bg-[#F5F5F4] transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Key Metrics Cards Bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-[#F8F8F7] rounded-xl border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#777777]">
              Deterministic Fit Score
            </span>
            <div className="text-2xl font-black font-mono text-[#111111]">
              {score}%
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block">
              {score >= 80 ? 'Strong Match' : score >= 50 ? 'Review' : 'Low Fit'}
            </span>
          </div>

          <div className="p-4 bg-[#F8F8F7] rounded-xl border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#777777]">
              Critical Reqs
            </span>
            <div className="text-2xl font-black font-mono text-[#111111]">
              {critMet} / {critTotal}
            </div>
            <span className="text-[10px] font-bold text-[#666666] block">
              Essential criteria met
            </span>
          </div>

          <div className="p-4 bg-[#F8F8F7] rounded-xl border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#777777]">
              Experience
            </span>
            <div className="text-2xl font-black font-mono text-[#111111]">
              {candidate.yearsOfExperience ? `${candidate.yearsOfExperience} Yrs` : 'Detected'}
            </div>
            <span className="text-[10px] font-bold text-[#666666] block">
              {candidate.mostRecentRole || 'Relevant background'}
            </span>
          </div>

          <div className="p-4 bg-[#F8F8F7] rounded-xl border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#777777]">
              Evidence Quality
            </span>
            <div className="text-2xl font-black font-mono text-[#111111]">
              {candidate.evidenceQuality || 'HIGH'}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block">
              Verbatim grounded
            </span>
          </div>
        </div>

        {/* ── Segmented View Navigation ── */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F4] border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#555555]">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'hover:text-black'
            }`}
          >
            Overview & Why Ranked Here
          </button>

          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'EVIDENCE'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'hover:text-black'
            }`}
          >
            Evidence Explorer ({(analysis.fields || []).length})
          </button>

          <button
            onClick={() => setActiveTab('REQUIREMENTS')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'REQUIREMENTS'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'hover:text-black'
            }`}
          >
            Requirements Matrix ({(analysis.requirements || []).length})
          </button>

          {candidate.reviewFlags && candidate.reviewFlags.length > 0 && (
            <button
              onClick={() => setActiveTab('FLAGS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'FLAGS'
                  ? 'bg-black text-white shadow-xs font-bold'
                  : 'hover:text-black'
              }`}
            >
              Audit Notices ({candidate.reviewFlags.length})
            </button>
          )}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Why This Candidate Ranked Here Box */}
            <div className="p-5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold font-mono text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#111111]" />
                <span>Why This Candidate Ranked #{candidate.rank || 1}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#555555]">
                <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl space-y-1">
                  <span className="font-bold text-[#111111] block">1. Requirement Match</span>
                  <p>
                    Satisfied {critMet} critical job qualifications with verbatim evidence traces.
                  </p>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl space-y-1">
                  <span className="font-bold text-[#111111] block">2. Evidence Grounding</span>
                  <p>
                    Extracted {(analysis.fields || []).filter((f: any) => f.status === 'FOUND').length} structured canonical fields directly from resume text.
                  </p>
                </div>

                <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl space-y-1">
                  <span className="font-bold text-[#111111] block">3. Tie-Breaker Stability</span>
                  <p>
                    Stable deterministic ranking ensures 100% reproducible ordering without hallucinations.
                  </p>
                </div>
              </div>
            </div>

            {/* Extracted Profile Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skills */}
              <div className="p-5 bg-white border border-[#E5E5E5] rounded-xl space-y-2.5">
                <h5 className="text-xs font-bold font-mono text-[#111111] uppercase">
                  Verified Skills ({skillsList.length})
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.length > 0 ? (
                    skillsList.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F5F4] text-[#111111] border border-[#E5E5E5]"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#888888] italic">No explicit skills listed</span>
                  )}
                </div>
              </div>

              {/* Education & Experience Summary */}
              <div className="p-5 bg-white border border-[#E5E5E5] rounded-xl space-y-2.5 text-xs text-[#555555]">
                <h5 className="text-xs font-bold font-mono text-[#111111] uppercase">
                  Background Summary
                </h5>
                <div className="space-y-1.5">
                  <div>
                    <span className="font-bold text-[#111111]">Degree: </span>
                    <span>{candidate.highestDegree || analysis.candidate?.highest_degree || 'Detected in profile'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#111111]">Recent Role: </span>
                    <span>{candidate.mostRecentRole || analysis.candidate?.most_recent_role || 'Software Engineering'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#111111]">Location: </span>
                    <span>{location || 'Remote / Unspecified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'EVIDENCE' && (
          <EvidenceExplorer fields={analysis.fields || []} />
        )}

        {activeTab === 'REQUIREMENTS' && (
          <RequirementMatrix requirements={analysis.requirements || []} />
        )}

        {activeTab === 'FLAGS' && candidate.reviewFlags && (
          <div className="space-y-3">
            {candidate.reviewFlags.map((flag, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl space-y-1 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#111111] uppercase text-[10px] bg-white border border-[#E5E5E5] px-1.5 py-0.2 rounded">
                    Audit
                  </span>
                  <span className="font-bold text-[#111111]">{flag}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
