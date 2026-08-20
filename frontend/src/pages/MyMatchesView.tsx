import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Building,
  MapPin,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import type { JobMatchItem, CandidateAccount } from '../types/candidate'
import type { JobOpening } from '../types/recruiter'

interface MyMatchesViewProps {
  matches: JobMatchItem[]
  jobs: JobOpening[]
  candidate: CandidateAccount | null
  onSelectJob: (job: JobOpening) => void
  onNavigateToProfile: () => void
}

export default function MyMatchesView({
  matches,
  jobs,
  candidate,
  onSelectJob,
  onNavigateToProfile,
}: MyMatchesViewProps) {
  if (!candidate) {
    return (
      <div className="dash-card p-12 bg-white text-center space-y-4">
        <Sparkles size={36} className="mx-auto text-blue-600" />
        <h3 className="text-lg font-black text-slate-900">Upload your resume to discover matches</h3>
        <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
          Our deterministic AI engine evaluates your resume against all active job requirements to show your top role fits and skill alignments.
        </p>
        <button
          onClick={onNavigateToProfile}
          className="btn-primary text-xs py-2.5 px-6 mx-auto font-bold shadow-sm"
        >
          Upload Resume Now →
        </button>
      </div>
    )
  }

  const topMatch = matches.length > 0 ? matches[0] : null
  const topJob = topMatch ? jobs.find((j) => j.id === topMatch.job_id) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dash-card p-6 sm:p-8 bg-white">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
          Career Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
          Jobs Matching Your Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
          Personalized role alignment based on your verified resume skills and qualifications.
        </p>
      </div>

      {/* Top Highlight Recommendation */}
      {topMatch && topJob && (
        <div className="dash-card p-6 sm:p-8 bg-gradient-to-br from-white to-blue-50/40 border-2 border-blue-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-blue-600 bg-blue-100/60 px-2.5 py-0.5 rounded border border-blue-200">
                #1 Top Recommended Match
              </span>
              <h2 className="text-2xl font-black text-slate-900">{topJob.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Building size={13} className="text-slate-400" />
                <span>{topJob.department || 'Engineering'}</span>
                <span>•</span>
                <MapPin size={13} className="text-slate-400" />
                <span>{topJob.location || 'Remote'}</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-blue-200 text-center space-y-0.5 shadow-xs">
              <span className="text-3xl font-black text-blue-600 font-mono">
                {topMatch.fit_score}%
              </span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Strong Match
              </p>
            </div>
          </div>

          {/* Why This Matches You */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-100">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold font-mono text-emerald-900 uppercase flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Why this matches you:</span>
              </h4>
              <ul className="text-xs text-emerald-800 space-y-1.5 font-medium">
                {topMatch.matched_requirements.slice(0, 4).map((r, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold font-mono text-amber-900 uppercase flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>Potential skill gap to review:</span>
              </h4>
              <ul className="text-xs text-amber-800 space-y-1.5 font-medium">
                {topMatch.missing_requirements.length > 0 ? (
                  topMatch.missing_requirements.slice(0, 3).map((r, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-rose-500 font-bold">✕</span>
                      <span>{r}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-emerald-700 font-semibold">
                    ✓ All core job requirements satisfied!
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onSelectJob(topJob)}
              className="btn-primary text-xs py-2.5 px-6 font-bold shadow-sm"
            >
              <span>View Job & Apply</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Other Matches Grid */}
      {matches.length > 1 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold font-mono text-slate-700 uppercase tracking-wider">
            Other Role Matches
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.slice(1).map((m) => {
              const job = jobs.find((j) => j.id === m.job_id)
              if (!job) return null

              return (
                <div
                  key={m.job_id}
                  className="dash-card p-5 bg-white space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {job.department || 'Engineering'}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          m.fit_score >= 80
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : m.fit_score >= 50
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {m.fit_score}% • {m.status_label}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{job.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{job.job_description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => onSelectJob(job)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
