import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Tag } from 'lucide-react'
import type { RequirementMatch } from '../types/resume'
import type { EnhancedRequirementMatch } from '../types/intelligence'

const STATUS_CONFIG = {
  MATCHED: { label: 'MATCHED', pill: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  PARTIAL: { label: 'PARTIAL', pill: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertTriangle },
  MISSING: { label: 'MISSING', pill: 'text-rose-700 bg-rose-50 border-rose-200', icon: XCircle },
}

const CONFIDENCE_CONFIG = {
  high: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low: 'text-rose-700 bg-rose-50 border-rose-200',
}

interface RequirementMatrixProps {
  requirements: (RequirementMatch | EnhancedRequirementMatch)[]
}

export default function RequirementMatrix({ requirements }: RequirementMatrixProps) {
  const [selectedReq, setSelectedReq] = useState<(RequirementMatch | EnhancedRequirementMatch) | null>(
    requirements[0] || null,
  )

  const matchedCount = requirements.filter((r) => r.match_status === 'MATCHED').length
  const partialCount = requirements.filter((r) => r.match_status === 'PARTIAL').length
  const missingCount = requirements.filter((r) => r.match_status === 'MISSING').length

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Job Description Alignment
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Requirement Matching Matrix
          </h3>
        </div>

        {/* Counter Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>{matchedCount} Matched</span>
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-600" />
            <span>{partialCount} Partial</span>
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 flex items-center gap-1.5">
            <XCircle size={13} className="text-rose-600" />
            <span>{missingCount} Missing</span>
          </span>
        </div>
      </div>

      {/* Split View: Left 45% (lg:col-span-5), Right 55% (lg:col-span-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Requirements list table (45%) */}
        <div className="lg:col-span-5 space-y-2.5">
          {requirements.map((req, idx) => {
            const isSelected = selectedReq?.requirement === req.requirement
            const cfg = STATUS_CONFIG[req.match_status] || STATUS_CONFIG.MISSING
            const Icon = cfg.icon
            const enh = req as EnhancedRequirementMatch

            return (
              <button
                key={idx}
                onClick={() => setSelectedReq(req)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 shadow-2xs ring-2 ring-blue-200/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon size={16} className={`flex-shrink-0 mt-0.5 ${cfg.pill.split(' ')[0]}`} />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {req.requirement}
                      </p>
                      {enh.priority && (
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                              enh.priority === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : enh.priority === 'IMPORTANT'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {enh.priority} (Weight: {enh.weight ?? 1})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0 ${cfg.pill}`}>
                    {cfg.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: Selected Requirement Details (55%) */}
        <div className="lg:col-span-7 sticky top-20">
          <AnimatePresence mode="wait">
            {selectedReq ? (
              <motion.div
                key={selectedReq.requirement}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="dash-card p-6 sm:p-7 space-y-5 bg-white"
              >
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Selected Requirement
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-snug">
                      {selectedReq.requirement}
                    </h4>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedReq.match_status]?.pill}`}>
                    {STATUS_CONFIG[selectedReq.match_status]?.label}
                  </span>
                </div>

                {/* Match Explanation */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                    Match Explanation
                  </label>
                  <p className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {selectedReq.explanation}
                  </p>
                </div>

                {/* Grounding Field Ref + Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                      Grounding Field Ref
                    </label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700 truncate">
                      {selectedReq.evidence_ref ?? 'None (Unmatched)'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                      Match Confidence
                    </label>
                    <div className={`p-3 text-center rounded-lg text-xs font-bold uppercase tracking-wider border ${CONFIDENCE_CONFIG[selectedReq.confidence]}`}>
                      {selectedReq.confidence} Confidence
                    </div>
                  </div>
                </div>

                {/* Priority & Weight Breakdown if available */}
                {(selectedReq as EnhancedRequirementMatch).priority && (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-blue-900 block">
                        Requirement Importance: {(selectedReq as EnhancedRequirementMatch).priority}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Weight Contribution: {(selectedReq as EnhancedRequirementMatch).weight}x
                      </span>
                    </div>
                    <span className="text-blue-700 font-bold font-mono">
                      Impact: {(selectedReq as EnhancedRequirementMatch).impact}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-600" /> Traceable Grounding
                  </span>
                  <span>Deterministic Evaluation</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
