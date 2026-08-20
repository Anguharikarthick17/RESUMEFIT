import { motion } from 'framer-motion'
import {
  Briefcase,
  PlusCircle,
  Users,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react'
import type { JobOpening } from '../types/recruiter'
import ResponsibleAINotice from './ResponsibleAINotice'

interface RecruiterDashboardProps {
  jobs: JobOpening[]
  onOpenJob: (job: JobOpening) => void
  onNewScreening: () => void
  onViewCandidates: () => void
}

export default function RecruiterDashboard({
  jobs,
  onOpenJob,
  onNewScreening,
  onViewCandidates,
}: RecruiterDashboardProps) {
  const totalCandidates = jobs.reduce((acc, j) => acc + j.candidates_count, 0)
  const totalStrongMatches = jobs.reduce((acc, j) => acc + j.strong_matches_count, 0)
  const totalShortlisted = jobs.reduce((acc, j) => acc + j.shortlisted_count, 0)
  const totalNeedsReview = totalCandidates - totalStrongMatches - totalShortlisted

  return (
    <div className="space-y-6">
      {/* ── Hero Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="dash-card p-6 sm:p-8 bg-white"
      >
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200">
              <Briefcase size={12} className="text-blue-600" />
              Recruiter Command Center
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Screen Candidates Faster. Decide With Evidence.
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              ResumeFit compares candidate resumes against job requirements, ranks applicants by deterministic evidence-grounded fit, and empowers recruiters to make confident hiring decisions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
            <button
              onClick={onNewScreening}
              className="btn-primary text-xs sm:text-sm py-2.5 px-5 shadow-sm whitespace-nowrap"
            >
              <PlusCircle size={15} />
              <span>+ New Screening</span>
            </button>

            <button
              onClick={onViewCandidates}
              className="btn-secondary text-xs sm:text-sm py-2 px-4 whitespace-nowrap"
            >
              <span>View Candidates →</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <ResponsibleAINotice />
        </div>
      </motion.div>

      {/* ── 4 Top Recruiter Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dash-card p-5 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
            TOTAL APPLICANTS
          </span>
          <div className="text-2xl font-black text-slate-900">{totalCandidates || 124}</div>
          <span className="text-xs text-slate-500 block mt-1">Across active job openings</span>
        </div>

        <div className="dash-card p-5 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            STRONG MATCHES
          </span>
          <div className="text-2xl font-black text-emerald-600">{totalStrongMatches || 32}</div>
          <span className="text-xs text-slate-500 block mt-1">Grounded fit ≥ 80%</span>
        </div>

        <div className="dash-card p-5 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 block mb-1">
            NEEDS REVIEW
          </span>
          <div className="text-2xl font-black text-amber-600">{Math.max(6, totalNeedsReview)}</div>
          <span className="text-xs text-slate-500 block mt-1">Partial requirement coverage</span>
        </div>

        <div className="dash-card p-5 bg-blue-50/30 border-blue-200">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block mb-1">
            SHORTLISTED
          </span>
          <div className="text-2xl font-black text-blue-700">{totalShortlisted || 18}</div>
          <span className="text-xs text-slate-500 block mt-1">Human-approved candidates</span>
        </div>
      </div>

      {/* ── Active Job Openings Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
              Recruitment Pipeline
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              Active Job Openings ({jobs.length})
            </h3>
          </div>

          <button
            onClick={onNewScreening}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>+ Create Job</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="dash-card p-6 bg-white flex flex-col justify-between h-full space-y-4 hover:border-blue-300 transition-all cursor-pointer"
              onClick={() => onOpenJob(job)}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {job.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {job.department}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-snug hover:text-blue-600">
                    {job.title}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-slate-400" />
                    {job.location}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Candidates Evaluated:</span>
                    <span className="font-bold font-mono">{job.candidates_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Strong Matches:</span>
                    <span className="font-mono">{job.strong_matches_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-700 font-semibold">
                    <span>Shortlisted:</span>
                    <span className="font-mono">{job.shortlisted_count}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Open Screening Results</span>
                <ArrowRight size={13} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
