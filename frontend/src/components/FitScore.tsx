import { motion } from 'framer-motion'
import type { FitScore as FitScoreType } from '../types/resume'

interface FitScoreProps {
  data: FitScoreType
}

export default function FitScore({ data }: FitScoreProps) {
  const { fit_score, score_label } = data

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (fit_score / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: '#10B981', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
    if (score >= 50) return { stroke: '#F59E0B', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
    return { stroke: '#EF4444', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
  }

  const colorCfg = getScoreColor(fit_score)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Circular Progress Gauge */}
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="7"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={colorCfg.stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 leading-none">
            {fit_score}
          </span>
          <span className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
            /100
          </span>
        </div>
      </div>

      {/* Score Description & Label */}
      <div className="text-center sm:text-left space-y-1.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${colorCfg.bg} ${colorCfg.text}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {score_label}
        </span>
        <h4 className="text-base font-bold text-slate-900">
          Candidate Fit Score
        </h4>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Deterministic evaluation based strictly on requirements matched against extracted resume evidence.
        </p>
      </div>
    </div>
  )
}
