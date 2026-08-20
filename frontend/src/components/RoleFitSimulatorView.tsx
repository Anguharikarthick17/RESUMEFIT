import { motion } from 'framer-motion'
import { Briefcase, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react'
import type { RoleFitResult } from '../types/intelligence'

interface RoleFitSimulatorViewProps {
  roles: RoleFitResult[]
}

export default function RoleFitSimulatorView({ roles }: RoleFitSimulatorViewProps) {
  const bestFit = roles.find((r) => r.is_best_fit) || roles[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Multi-Role Market Readiness
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Role Fit Simulator
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Evaluated against 6 core industry specialization profiles
        </div>
      </div>

      {/* Best Current Fit Hero Banner */}
      {bestFit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card p-6 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
              ★ Best Current Match
            </span>
            <h4 className="text-xl font-black text-slate-900">
              {bestFit.role_title} ({bestFit.fit_score}% Alignment)
            </h4>
            <p className="text-xs text-slate-600 max-w-xl">
              Candidate exhibits strongest evidence grounding for this position based on extracted skills, projects, and educational background.
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-3xl font-black font-mono text-blue-600">
              {bestFit.fit_score}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              Market Fit Index
            </span>
          </div>
        </motion.div>
      )}

      {/* 6 Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role, idx) => (
          <motion.div
            key={role.role_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`dash-card p-5 bg-white flex flex-col justify-between h-full space-y-4 ${
              role.is_best_fit ? 'ring-2 ring-blue-500/80' : ''
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h5 className="text-sm font-bold text-slate-900 leading-snug">
                  {role.role_title}
                </h5>
                <span className="text-sm font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {role.fit_score}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    role.fit_score >= 75
                      ? 'bg-emerald-500'
                      : role.fit_score >= 50
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${role.fit_score}%` }}
                />
              </div>

              {/* Strong Areas */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block mb-1">
                  Strong Evidence ({role.strong_areas.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {role.strong_areas.length > 0 ? (
                    role.strong_areas.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No direct matches</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                  Unmatched Gaps ({role.missing_skills.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {role.missing_skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Standard Market Spec</span>
              <span className="text-blue-600 font-semibold flex items-center">
                View Role Spec <ArrowUpRight size={11} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
