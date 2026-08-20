import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  UserCheck,
  Star,
  Clock,
  Ban,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  CheckSquare,
  ShieldCheck,
  Printer,
  ChevronRight,
} from 'lucide-react'
import type { RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'
import FitScore from './FitScore'
import EvidenceExplorer from './EvidenceExplorer'
import RequirementMatrix from './RequirementMatrix'
import PrintReportModal from './PrintReportModal'

interface CandidateDetailModalProps {
  candidate: RankedCandidate
  jobTitle: string
  onClose: () => void
  onUpdateDecision: (candidateId: string, decision: RecruiterDecisionStatus) => void
}

export default function CandidateDetailModal({
  candidate,
  jobTitle,
  onClose,
  onUpdateDecision,
}: CandidateDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'evidence' | 'matrix' | 'flags' | 'overview'>('overview')
  const [showPrintModal, setShowPrintModal] = useState(false)

  const currentDecision = candidate.recruiterDecision

  const handleDecision = (decision: RecruiterDecisionStatus) => {
    onUpdateDecision(candidate.id, decision)
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
        
        {/* ── Top Header & Close ── */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                Rank #{candidate.rank} • ID: {candidate.id}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Evaluating for: <strong>{jobTitle}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <Printer size={13} />
                <span>Export Report</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Candidate Overview Header Card ── */}
          <div className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-center">
            {/* Left Info */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center flex-shrink-0 shadow-2xs">
                {getInitials(candidate.candidateName)}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 truncate">
                    {candidate.candidateName}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono border ${
                      candidate.aiRecommendation === 'STRONG MATCH'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : candidate.aiRecommendation === 'REVIEW'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    AI: {candidate.aiRecommendation}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  {candidate.mostRecentRole ?? candidate.highestDegree ?? 'Candidate Profile'}
                </p>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-0.5">
                  {candidate.email && <span>{candidate.email}</span>}
                  {candidate.phone && <span>• {candidate.phone}</span>}
                  {candidate.location && <span>• {candidate.location}</span>}
                </div>
              </div>
            </div>

            {/* Right Score Badges */}
            <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
              <div className="text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">RAW FIT</span>
                <span className="text-2xl font-black text-slate-900">{candidate.rawFitScore}%</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600 block">WEIGHTED</span>
                <span className="text-2xl font-black text-blue-600">{candidate.weightedFitScore}%</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 block">CRITICAL</span>
                <span className="text-2xl font-black text-emerald-600">{candidate.criticalMatched}/{candidate.criticalTotal}</span>
              </div>
            </div>
          </div>

          {/* ── Human-In-The-Loop Decision Bar ── */}
          <div className="mt-4 p-4 rounded-xl bg-white border-2 border-blue-500/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 font-mono uppercase">
                Recruiter Hiring Decision:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold font-mono text-[11px] uppercase border ${
                  currentDecision === 'SHORTLISTED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : currentDecision === 'REVIEW'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : currentDecision === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {currentDecision}
              </span>
            </div>

            {/* Decision Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecision('SHORTLISTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentDecision === 'SHORTLISTED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Star size={13} />
                <span>Shortlist</span>
              </button>

              <button
                onClick={() => handleDecision('REVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentDecision === 'REVIEW'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock size={13} />
                <span>Mark for Review</span>
              </button>

              <button
                onClick={() => handleDecision('REJECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentDecision === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <Ban size={13} />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* ── Sub-navigation Tabs ── */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pt-4 pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Why Ranked Here
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3.5 py-1.5 rounded-t-lg text-xs font-bold transition-all border-b-2 flex items-center gap-1 ${
                activeTab === 'evidence'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSearch size={13} />
              <span>Evidence Explorer</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-t-lg text-xs font-bold transition-all border-b-2 flex items-center gap-1 ${
                activeTab === 'matrix'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckSquare size={13} />
              <span>Requirement Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('flags')}
              className={`px-3.5 py-1.5 rounded-t-lg text-xs font-bold transition-all border-b-2 flex items-center gap-1 ${
                activeTab === 'flags'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle size={13} />
              <span>Review Flags ({candidate.reviewFlags.length})</span>
            </button>
          </div>

          {/* ── Tab Panes ── */}
          <div className="pt-4">
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Why This Candidate Ranked Here Section */}
                <div className="dash-card p-5 bg-white space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
                    Transparent Ranking Explanation
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Why {candidate.candidateName} Ranked #{candidate.rank} ({candidate.weightedFitScore}% Weighted Fit)
                  </h4>
                  
                  <div className="grid md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                      <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase block mb-1">
                        Critical Requirement Coverage
                      </span>
                      <p className="text-emerald-900 font-bold text-sm">
                        {candidate.criticalMatched} of {candidate.criticalTotal} Critical Met
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Carries 3x scoring weight in candidate evaluation.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                      <span className="text-[10px] font-mono text-blue-800 font-bold uppercase block mb-1">
                        Evidence Grounding Quality
                      </span>
                      <p className="text-blue-900 font-bold text-sm">
                        {candidate.evidenceQuality} Quality
                      </p>
                      <p className="text-[11px] text-blue-700 mt-1">
                        All claims grounded in verbatim extracted text spans.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block mb-1">
                        Experience & Background
                      </span>
                      <p className="text-slate-900 font-bold text-sm">
                        {candidate.experienceSummary}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Extracted from Experience & Education sections.
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Summary */}
                <div className="dash-card p-5 bg-white space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">
                      Recommendation Breakdown
                    </span>
                    <span className="text-xs font-mono text-slate-400">Non-binding recommendation</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block mb-1">
                        ✓ Key Strengths
                      </span>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {candidate.shortlistRec.reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-700 block mb-1">
                        ⚠ Considerations & Gaps
                      </span>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {candidate.shortlistRec.concerns.length > 0 ? (
                          candidate.shortlistRec.concerns.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <AlertTriangle size={12} className="text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400 italic">No major gaps identified</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="dash-card p-5 bg-white">
                <EvidenceExplorer fields={candidate.data.fields} />
              </div>
            )}

            {activeTab === 'matrix' && (
              <div className="dash-card p-5 bg-white">
                <RequirementMatrix requirements={candidate.enhancedReqs} />
              </div>
            )}

            {activeTab === 'flags' && (
              <div className="dash-card p-5 bg-white space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">
                  Audit Checks & Considerations
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Review Flags for {candidate.candidateName}
                </h4>

                <div className="space-y-2 pt-1">
                  {candidate.reviewFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-800 font-medium flex items-start gap-2.5"
                    >
                      <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Grounded Field Tracing Engine</span>
          <span>Deterministic Audit ID: {candidate.id}</span>
        </div>
      </div>

      {/* Print Report Modal */}
      {showPrintModal && (
        <PrintReportModal
          data={candidate.data}
          weighted={candidate.weightedScoreObj}
          readiness={candidate.readinessScoreObj}
          recommendation={candidate.shortlistRec}
          analysisId={candidate.id}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  )
}
