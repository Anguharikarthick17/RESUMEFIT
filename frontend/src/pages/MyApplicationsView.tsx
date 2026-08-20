import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileCheck2,
  Building,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import type { JobApplicationItem } from '../types/candidate'
import type { JobOpening } from '../types/recruiter'

interface MyApplicationsViewProps {
  applications: JobApplicationItem[]
  onExploreJobs: () => void
  onViewJobDetail: (job: JobOpening) => void
}

export default function MyApplicationsView({
  applications,
  onExploreJobs,
  onViewJobDetail,
}: MyApplicationsViewProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            <span>Shortlisted</span>
          </span>
        )
      case 'under_review':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <Clock size={13} />
            <span>Under Review</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1.5">
            <XCircle size={13} />
            <span>Not Selected</span>
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <FileCheck2 size={13} />
            <span>Applied</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
            Application Tracker
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            My Job Applications ({applications.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
            Track your application status and recruiter reviews in real-time.
          </p>
        </div>

        <button
          onClick={onExploreJobs}
          className="btn-primary text-xs sm:text-sm py-2.5 px-5 shadow-sm self-start md:self-auto"
        >
          <Sparkles size={15} />
          <span>Browse More Openings</span>
        </button>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="dash-card p-12 bg-white text-center space-y-4">
          <FileCheck2 size={36} className="mx-auto text-slate-300" />
          <div>
            <h4 className="text-base font-bold text-slate-800">No applications submitted yet.</h4>
            <p className="text-xs text-slate-500 font-sans mt-1">
              Explore open positions, check your evidence-grounded fit score, and apply in 1-click.
            </p>
          </div>
          <button
            onClick={onExploreJobs}
            className="btn-primary text-xs py-2 px-4 mx-auto font-bold"
          >
            Explore Active Jobs →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="dash-card p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Building size={12} />
                    <span>{app.jobs?.department || 'Engineering'}</span>
                  </span>
                  <span>•</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {app.jobs?.title || 'Job Opening'}
                </h3>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                    <span>Fit Score: {app.fit_score}%</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {app.jobs?.location || 'Remote'}
                  </span>
                </div>
              </div>

              {/* Status Badge & Action */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {getStatusBadge(app.status)}

                {app.jobs && (
                  <button
                    onClick={() => onViewJobDetail(app.jobs!)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                  >
                    <span>View Spec</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
