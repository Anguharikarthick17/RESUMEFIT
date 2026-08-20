import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, Target, ArrowRight } from 'lucide-react'
import type { LearningRoadmapGoal } from '../types/intelligence'

interface LearningRoadmapViewProps {
  roadmap: LearningRoadmapGoal[]
  onOpenSimulator?: () => void
}

export default function LearningRoadmapView({ roadmap, onOpenSimulator }: LearningRoadmapViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Personalized Career Growth
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            Your 30-Day Job Readiness Roadmap
          </h3>
        </div>

        {onOpenSimulator && (
          <button
            onClick={onOpenSimulator}
            className="btn-primary text-xs py-2 px-3.5 font-bold shadow-xs"
          >
            <span>Simulate Improvement Impact</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* 4-Week Milestone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {roadmap.map((goal, idx) => (
          <motion.div
            key={goal.week}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="dash-card p-5 bg-white flex flex-col justify-between h-full space-y-4 hover:border-black transition-all"
          >
            <div className="space-y-3">
              {/* Week & Priority Badge */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#F5F5F4] text-[#111111] border border-[#E5E5E5]">
                  WEEK {goal.week}
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    goal.priority === 'HIGH'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : goal.priority === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {goal.priority} Priority
                </span>
              </div>

              {/* Title & Target Skill */}
              <div>
                <h4 className="text-sm font-bold text-[#111111] leading-snug">
                  {goal.title}
                </h4>
                <div className="text-xs font-semibold text-[#111111] mt-1 flex items-center gap-1 font-mono">
                  <Target size={12} /> {goal.skill}
                </div>
              </div>

              {/* Reason / Impact */}
              <p className="text-xs text-[#555555] leading-relaxed bg-[#F8F8F7] p-2.5 rounded-lg border border-[#E5E5E5]">
                {goal.reason}
              </p>

              {/* Recommended Focus Checklist */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono font-bold text-[#777777] uppercase tracking-wider block">
                  Weekly Milestones
                </span>
                {goal.recommended_focus.map((focus, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-1.5 text-xs text-[#333333] font-medium">
                    <CheckCircle2 size={12} className="text-black flex-shrink-0 mt-0.5" />
                    <span>{focus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#777777] font-mono">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {goal.estimated_hours} hrs effort
              </span>
              <span className="text-emerald-700 font-bold">+Impact</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
