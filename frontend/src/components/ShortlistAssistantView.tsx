import { motion } from 'framer-motion'
import { UserCheck, AlertTriangle, XCircle, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react'
import type { ShortlistRecommendation } from '../types/intelligence'
import type { CandidateProfile } from '../types/resume'

interface ShortlistAssistantViewProps {
  candidate: CandidateProfile
  recommendation: ShortlistRecommendation
  fitScore: number
  weightedScore: number
}

export default function ShortlistAssistantView({
  candidate,
  recommendation,
  fitScore,
  weightedScore,
}: ShortlistAssistantViewProps) {
  const isShortlist = recommendation.decision === 'SHORTLIST'
  const isReview = recommendation.decision === 'REVIEW'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Deterministic Decision Support
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Recruiter Decision Panel
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Transparent, evidence-grounded recommendation
        </div>
      </div>

      {/* Decision Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`dash-card p-6 sm:p-8 ${
          isShortlist
            ? 'bg-emerald-50/40 border-emerald-300'
            : isReview
            ? 'bg-amber-50/40 border-amber-300'
            : 'bg-rose-50/40 border-rose-300'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-5 border-b border-slate-200/80">
          <div className="space-y-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isShortlist
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : isReview
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300'
              }`}
            >
              DECISION: {recommendation.decision}
            </span>
            <h4 className="text-2xl font-black text-slate-900 mt-2">
              {recommendation.headline}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Evaluation for <strong>{candidate.full_name ?? 'Candidate'}</strong> based on grounded requirement fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-mono text-slate-400 font-bold block">
                RAW FIT
              </span>
              <span className="text-xl font-black text-slate-900">
                {fitScore}%
              </span>
            </div>

            <div className="text-center p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-mono text-blue-600 font-bold block">
                WEIGHTED FIT
              </span>
              <span className="text-xl font-black text-blue-600">
                {weightedScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Grounds & Reasons Grid */}
        <div className="grid md:grid-cols-2 gap-6 pt-5">
          {/* Key Positive Factors */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold font-mono text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Supporting Factors ({recommendation.reasons.length})
            </h5>

            <div className="space-y-2">
              {recommendation.reasons.map((r, i) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium flex items-start gap-2 shadow-2xs">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Considerations / Concerns */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold font-mono text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              Considerations & Gaps ({recommendation.concerns.length})
            </h5>

            <div className="space-y-2">
              {recommendation.concerns.length === 0 ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                  Zero major concerns identified.
                </div>
              ) : (
                recommendation.concerns.map((c, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium flex items-start gap-2 shadow-2xs">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <span>{c}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
