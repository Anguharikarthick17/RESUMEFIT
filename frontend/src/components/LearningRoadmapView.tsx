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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Personalized Career Growth
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Your 30-Day Job Readiness Roadmap
          </h3>
        </div>

        {onOpenSimulator && (
          <button
            onClick={onOpenSimulator}
            className="btn-primary text-xs py-2 px-3.5"
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
            className="dash-card p-5 bg-white flex flex-col justify-between h-full space-y-4"
          >
            <div className="space-y-3">
              {/* Week & Priority Badge */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
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
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {goal.title}
                </h4>
                <div className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1 font-mono">
                  <Target size={12} /> {goal.skill}
                </div>
              </div>

              {/* Reason / Impact */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {goal.reason}
              </p>

              {/* Recommended Focus Checklist */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Weekly Milestones
                </span>
                {goal.recommended_focus.map((focus, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-1.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{focus}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {goal.estimated_hours} hrs effort
              </span>
              <span className="text-emerald-600 font-bold">+Impact</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
