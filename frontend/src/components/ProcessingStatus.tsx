import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface ProcessingStatusProps {
  step: string
  progress: number
}

const STEPS = [
  { id: 'upload',   num: '01', label: 'Resume', desc: 'Ingestion & file validation' },
  { id: 'extract',  num: '02', label: 'Extract', desc: 'Deterministic text layer extraction' },
  { id: 'segment',  num: '03', label: 'Segment', desc: 'Allowlist section mapping' },
  { id: 'parse',    num: '04', label: 'Parse', desc: '10 structured candidate fields' },
  { id: 'evidence', num: '05', label: 'Evidence', desc: 'Verbatim resume text tracing' },
  { id: 'match',    num: '06', label: 'Match', desc: 'JD requirement evaluation' },
  { id: 'score',    num: '07', label: 'Fit Score', desc: 'Deterministic match report' },
]

function getStepIndex(progress: number): number {
  if (progress < 15) return 0
  if (progress < 30) return 1
  if (progress < 45) return 2
  if (progress < 60) return 3
  if (progress < 75) return 4
  if (progress < 90) return 5
  return 6
}

export default function ProcessingStatus({ step, progress }: ProcessingStatusProps) {
  const activeIndex = getStepIndex(progress)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="dash-card p-6 sm:p-7 max-w-lg w-full mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
            <Loader2 size={18} className="animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Analyzing Candidate Fit
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Deterministic evidence pipeline
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
          {progress}%
        </span>
      </div>

      {/* Current Step Label */}
      <div className="mb-2.5">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className="text-xs font-bold text-slate-800 truncate"
          >
            {step}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>

      {/* Step Sequence Checklist */}
      <div className="space-y-1.5">
        {STEPS.map((s, i) => {
          const isDone = i < activeIndex
          const isCurrent = i === activeIndex

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                isCurrent
                  ? 'bg-blue-50/90 border border-blue-200'
                  : 'bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                  ) : (
                    s.num
                  )}
                </div>

                <span
                  className={`font-semibold ${
                    isDone
                      ? 'text-slate-600'
                      : isCurrent
                      ? 'text-blue-900 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                {isDone ? (
                  <span className="text-emerald-600 font-semibold">✓ Completed</span>
                ) : isCurrent ? (
                  <span className="text-blue-600 font-bold">● Active</span>
                ) : (
                  '○ Pending'
                )}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
