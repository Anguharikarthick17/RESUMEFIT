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
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Multi-Role Market Readiness
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            Role Fit Simulator
          </h3>
        </div>

        <div className="text-xs text-[#777777] font-mono">
          Evaluated against 6 core industry specialization profiles
        </div>
      </div>

      {/* Best Current Fit Hero Banner */}
      {bestFit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card p-6 bg-white border-2 border-[#111111] flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2 py-0.5 rounded border border-[#E5E5E5]">
              ★ Best Current Match
            </span>
            <h4 className="text-xl font-black text-[#111111]">
              {bestFit.role_title} ({bestFit.fit_score}% Alignment)
            </h4>
            <p className="text-xs text-[#666666] max-w-xl font-sans">
              Candidate exhibits strongest evidence grounding for this position based on extracted skills, projects, and educational background.
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-3xl font-black font-mono text-[#111111]">
              {bestFit.fit_score}%
            </span>
            <span className="text-[10px] text-[#777777] font-mono block">
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
            className={`dash-card p-5 bg-white flex flex-col justify-between h-full space-y-4 hover:border-black transition-all ${
              role.is_best_fit ? 'ring-1 ring-black border-black' : ''
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h5 className="text-sm font-bold text-[#111111] leading-snug">
                  {role.role_title}
                </h5>
                <span className="text-sm font-black font-mono text-[#111111] bg-[#F5F5F4] px-2 py-0.5 rounded border border-[#E5E5E5]">
                  {role.fit_score}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#F0F0F0] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    role.fit_score >= 75
                      ? 'bg-emerald-600'
                      : role.fit_score >= 50
                      ? 'bg-black'
                      : 'bg-amber-600'
                  }`}
                  style={{ width: `${role.fit_score}%` }}
                />
              </div>

              {/* Strong Areas */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block mb-1">
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
                    <span className="text-[11px] text-[#888888] italic">No direct matches</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#777777] block mb-1">
                  Unmatched Gaps ({role.missing_skills.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {role.missing_skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F5F5F4] text-[#555555] border border-[#E5E5E5]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#777777]">
              <span>Standard Market Spec</span>
              <span className="text-[#111111] font-semibold flex items-center hover:underline cursor-pointer">
                View Role Spec <ArrowUpRight size={11} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
