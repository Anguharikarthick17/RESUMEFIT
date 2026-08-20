import { motion } from 'framer-motion'
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react'
import type { ClaimStrengthItem } from '../types/intelligence'

interface ResumeClaimAnalysisViewProps {
  claims: ClaimStrengthItem[]
}

export default function ResumeClaimAnalysisView({ claims }: ResumeClaimAnalysisViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Grounding Audit
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Resume Claim & Evidence Strength
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Objectively evaluating supporting evidence for extracted candidate claims
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {claims.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="dash-card p-5 bg-white space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {item.claim}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ({item.extracted_skill_or_term})
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 inline-flex items-center gap-1 ${
                  item.quality === 'Strong'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : item.quality === 'Moderate'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : item.quality === 'Weak'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {item.quality === 'Strong' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                <span>{item.quality} Evidence</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {item.status_explanation}
            </p>

            {item.evidence_quote && (
              <blockquote className="p-3 bg-slate-50 border-l-3 border-blue-600 rounded-r-lg text-xs italic text-slate-700 font-mono">
                "{item.evidence_quote}"
              </blockquote>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
