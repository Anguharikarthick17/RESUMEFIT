import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Star,
  Briefcase,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  TrendingUp,
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
  // Aggregate real numbers across jobs
  const totalCandidates = jobs.reduce((sum, j) => sum + (j.candidates_count || 0), 0)
  const totalStrongMatches = jobs.reduce((sum, j) => sum + (j.strong_matches_count || 0), 0)
  const totalShortlisted = jobs.reduce((sum, j) => sum + (j.shortlisted_count || 0), 0)
  const totalNeedsReview = Math.max(0, totalCandidates - totalStrongMatches - totalShortlisted)

  return (
    <div className="space-y-8">
      {/* ── 1. Hero / Header Section ── */}
      <div className="dash-card p-6 sm:p-10 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5]">
            <Sparkles size={11} className="text-[#111111]" />
            <span>Recruiter Command Center</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#111111] tracking-tight">
            Screen Candidates Faster. <br className="hidden sm:inline" />
            Decide With Evidence.
          </h1>

          <p className="text-xs sm:text-sm text-[#666666] font-sans max-w-2xl leading-relaxed">
            Evidence-grounded resume intelligence platform for talent teams. Screen hundreds of resumes with verbatim proof, reproducible deterministic ranking, and human-in-the-loop hiring decisions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto flex-shrink-0">
          <button
            onClick={onNewScreening}
            className="btn-primary text-xs sm:text-sm py-2.5 px-5 shadow-sm"
          >
            <PlusCircle size={15} />
            <span>+ New Screening</span>
          </button>

          <button
            onClick={onViewCandidates}
            className="btn-secondary text-xs sm:text-sm py-2.5 px-5"
          >
            <span>View Candidates →</span>
          </button>
        </div>
      </div>

      {/* ── 2. Responsible AI Notice ── */}
      <ResponsibleAINotice />

      {/* ── 3. Four Core Recruiter Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Applicants */}
        <div className="dash-card p-5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
              Total Applicants
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
              <Users size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#111111]">
              {totalCandidates}
            </span>
            <span className="text-[11px] text-[#666666] font-medium">Processed</span>
          </div>
        </div>

        {/* Metric 2: Strong Matches */}
        <div className="dash-card p-5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
              Strong Matches
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#111111]">
              {totalStrongMatches}
            </span>
            <span className="text-[11px] text-emerald-700 font-bold">Fit Score ≥ 80%</span>
          </div>
        </div>

        {/* Metric 3: Needs Review */}
        <div className="dash-card p-5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
              Needs Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#111111]">
              {totalNeedsReview}
            </span>
            <span className="text-[11px] text-amber-700 font-bold">Fit Score 50–79%</span>
          </div>
        </div>

        {/* Metric 4: Shortlisted */}
        <div className="dash-card p-5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
              Shortlisted
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
              <Star size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#111111]">
              {totalShortlisted}
            </span>
            <span className="text-[11px] text-[#111111] font-bold">Recruiter Approved</span>
          </div>
        </div>
      </div>

      {/* ── 4. Active Job Openings Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#111111] tracking-tight">
              Active Job Openings
            </h3>
            <p className="text-xs text-[#666666] font-sans">
              Select a position to review candidate ranking, evidence traces, and hiring recommendations.
            </p>
          </div>

          <button
            onClick={onNewScreening}
            className="text-xs font-bold text-[#111111] hover:text-black flex items-center gap-1 hover:underline"
          >
            <span>+ Create Opening</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onOpenJob(job)}
              className="dash-card p-6 bg-white space-y-4 cursor-pointer hover:border-[#111111] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Department + Status */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-[#F5F5F4] text-[#111111] px-2 py-0.5 rounded border border-[#E5E5E5]">
                    {job.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-[#777777] font-mono flex items-center gap-1">
                    <Building size={12} />
                    <span>{job.department || 'Engineering'}</span>
                  </span>
                </div>

                {/* Job Title */}
                <div>
                  <h4 className="text-base font-bold text-[#111111] line-clamp-1">
                    {job.title}
                  </h4>
                  <p className="text-xs text-[#666666] font-mono mt-0.5">
                    {job.location || 'Remote'} • {job.experience_level || 'Mid-Senior'}
                  </p>
                </div>

                {/* Description Preview */}
                <p className="text-xs text-[#666666] font-sans line-clamp-2 leading-relaxed">
                  {job.job_description}
                </p>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E5E5E5] text-center">
                  <div className="p-2 bg-[#F8F8F7] rounded-lg">
                    <span className="text-xs font-mono font-bold text-[#111111] block">
                      {job.candidates_count || 0}
                    </span>
                    <span className="text-[9px] text-[#777777] font-mono uppercase">
                      Applicants
                    </span>
                  </div>

                  <div className="p-2 bg-[#F8F8F7] rounded-lg">
                    <span className="text-xs font-mono font-bold text-emerald-700 block">
                      {job.strong_matches_count || 0}
                    </span>
                    <span className="text-[9px] text-[#777777] font-mono uppercase">
                      Strong
                    </span>
                  </div>

                  <div className="p-2 bg-[#F8F8F7] rounded-lg">
                    <span className="text-xs font-mono font-bold text-[#111111] block">
                      {job.shortlisted_count || 0}
                    </span>
                    <span className="text-[9px] text-[#777777] font-mono uppercase">
                      Shortlist
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-xs font-bold text-[#111111]">
                <span>Screening Queue</span>
                <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Results</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
