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
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Grounding Audit
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            Resume Claim & Evidence Strength
          </h3>
        </div>

        <div className="text-xs text-[#777777] font-mono">
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
                <span className="text-sm font-bold text-[#111111]">
                  {item.claim}
                </span>
                <span className="text-xs font-mono text-[#777777]">
                  ({item.extracted_skill_or_term})
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 inline-flex items-center gap-1 ${
                  item.quality === 'Strong'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : item.quality === 'Moderate'
                    ? 'bg-[#F5F5F4] text-[#111111] border-[#E5E5E5]'
                    : item.quality === 'Weak'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {item.quality === 'Strong' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                <span>{item.quality} Evidence</span>
              </span>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed">
              {item.status_explanation}
            </p>

            {item.evidence_quote && (
              <blockquote className="p-3 bg-[#F8F8F7] border-l-3 border-black rounded-r-lg text-xs italic text-[#333333] font-mono">
                "{item.evidence_quote}"
              </blockquote>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
