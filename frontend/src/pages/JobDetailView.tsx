import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  Sparkles,
  FileText,
  ShieldCheck,
  Quote,
} from 'lucide-react'
import type { JobOpening } from '../types/recruiter'
import type { CandidateAccount, JobMatchItem } from '../types/candidate'

interface JobDetailViewProps {
  job: JobOpening
  candidate: CandidateAccount | null
  match?: JobMatchItem
  isApplied: boolean
  onBack: () => void
  onApply: (job: JobOpening) => void
  onNavigateToProfile: () => void
}

export default function JobDetailView({
  job,
  candidate,
  match,
  isApplied,
  onBack,
  onApply,
  onNavigateToProfile,
}: JobDetailViewProps) {
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const score = match ? match.fit_score : null

  const handleConfirmApply = async () => {
    setSubmitting(true)
    await onApply(job)
    setSubmitting(false)
    setShowApplyModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <button
        onClick={onBack}
        className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to All Jobs</span>
      </button>

      {/* Header Card */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
              {job.department || 'Engineering'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded">
              Active Opening
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{job.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-slate-400" />
              <span>{job.location || 'Remote'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              <span>Full-time</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Briefcase size={13} className="text-slate-400" />
              <span>{job.experience_level || 'Mid-Senior Level'}</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-end gap-2">
          {isApplied ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Application Submitted</span>
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              disabled={!candidate}
              className="btn-primary py-3 px-8 text-sm font-bold shadow-md disabled:opacity-40"
            >
              <Send size={15} />
              <span>Apply to this Job</span>
            </button>
          )}

          {!candidate && (
            <span className="text-[11px] text-slate-400 font-mono">
              Upload resume first to apply
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Spec + Resume Fit Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="dash-card p-6 sm:p-8 bg-white space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Job Description & Responsibilities
            </h3>

            <div className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed whitespace-pre-line space-y-3">
              {job.job_description}
            </div>
          </div>
        </div>

        {/* Right Column: Your Resume Fit */}
        <div className="space-y-6">
          {candidate ? (
            <div className="dash-card p-6 bg-white space-y-5 border-2 border-blue-100">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600 block">
                  AI Fit Analysis
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Your Match Score
                </h3>
              </div>

              {/* Big Score Box */}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200 text-center space-y-1">
                <span className="text-4xl font-black text-blue-700 font-mono">
                  {score ?? '--'}
                  <span className="text-xl text-blue-400 font-sans"> / 100</span>
                </span>
                <p className="text-xs font-bold text-blue-900">
                  {score && score >= 80 ? 'Strong Match' : score && score >= 50 ? 'Needs Review' : 'Low Fit'}
                </p>
              </div>

              {/* Requirement Breakdown */}
              {match && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                    Grounded Requirement Match
                  </span>

                  <div className="space-y-2">
                    {match.matched_requirements.map((r, idx) => (
                      <div key={idx} className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                          <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                          <span>{r}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">MATCHED</span>
                      </div>
                    ))}

                    {match.partial_requirements.map((r, idx) => (
                      <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                          <span>{r}</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-700 font-bold">PARTIAL</span>
                      </div>
                    ))}

                    {match.missing_requirements.map((r, idx) => (
                      <div key={idx} className="p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                          <XCircle size={13} className="text-rose-600 flex-shrink-0" />
                          <span>{r}</span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-700 font-bold">MISSING</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Explorer */}
              {match && match.requirements && match.requirements.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                    Verbatim Resume Evidence
                  </span>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {match.requirements
                      .filter((r: any) => r.evidence_snippet)
                      .slice(0, 3)
                      .map((r: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <span className="font-bold text-slate-900 block">{r.requirement}</span>
                          <p className="text-[11px] text-slate-600 italic font-mono flex items-start gap-1">
                            <Quote size={11} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>"{r.evidence_snippet}"</span>
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="dash-card p-6 bg-white text-center space-y-3">
              <Sparkles size={28} className="mx-auto text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">Want to see your fit?</h4>
              <p className="text-xs text-slate-500 font-sans">
                Upload your master resume to calculate match scores and view evidence.
              </p>
              <button
                onClick={onNavigateToProfile}
                className="btn-primary text-xs py-2 px-4 mx-auto font-bold"
              >
                Upload Resume Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showApplyModal && candidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Confirm Application</h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Job:</span>
                <span className="font-bold text-slate-900">{job.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Applicant:</span>
                <span className="font-bold text-slate-900">{candidate.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Resume:</span>
                <span className="font-semibold text-blue-600">{candidate.resume_filename || 'Master Resume'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Fit Score:</span>
                <span className="font-bold text-emerald-700">{score ?? '--'}%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-sans">
              Your profile, resume, and evidence-grounded fit score will be submitted to the recruiting team.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmApply}
                disabled={submitting}
                className="btn-primary px-5 py-2 text-xs font-bold shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Confirm Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
