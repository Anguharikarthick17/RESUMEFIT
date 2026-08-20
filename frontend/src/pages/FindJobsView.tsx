import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  MapPin,
  Building,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  Send,
  Clock,
} from 'lucide-react'
import type { JobOpening } from '../types/recruiter'
import type { CandidateAccount, JobMatchItem } from '../types/candidate'

interface FindJobsViewProps {
  jobs: JobOpening[]
  candidate: CandidateAccount | null
  matches: JobMatchItem[]
  onSelectJob: (job: JobOpening) => void
  onApplyJob: (job: JobOpening) => void
  onNavigateToProfile: () => void
  appliedJobIds: string[]
}

export default function FindJobsView({
  jobs,
  candidate,
  matches,
  onSelectJob,
  onApplyJob,
  onNavigateToProfile,
  appliedJobIds,
}: FindJobsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'STRONG' | 'REVIEW' | 'LOW'>('ALL')
  const [sortBy, setSortBy] = useState<'MATCH' | 'NEWEST' | 'TITLE'>('MATCH')

  const matchMap = useMemo(() => {
    const map = new Map<string, JobMatchItem>()
    for (const m of matches) {
      map.set(m.job_id, m)
    }
    return map
  }, [matches])

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((j) => {
        const q = searchQuery.toLowerCase()
        const titleMatch = j.title.toLowerCase().includes(q)
        const deptMatch = (j.department || '').toLowerCase().includes(q)
        const descMatch = (j.job_description || '').toLowerCase().includes(q)
        const textMatch = titleMatch || deptMatch || descMatch

        if (!textMatch) return false

        const match = matchMap.get(j.id)
        const score = match ? match.fit_score : 0

        if (scoreFilter === 'STRONG') return score >= 80
        if (scoreFilter === 'REVIEW') return score >= 50 && score < 80
        if (scoreFilter === 'LOW') return score < 50
        return true
      })
      .sort((a, b) => {
        const scoreA = matchMap.get(a.id)?.fit_score || 0
        const scoreB = matchMap.get(b.id)?.fit_score || 0

        if (sortBy === 'MATCH') return scoreB - scoreA
        if (sortBy === 'TITLE') return a.title.localeCompare(b.title)
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      })
  }, [jobs, searchQuery, scoreFilter, sortBy, matchMap])

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
            Opportunity Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Find Your Next Opportunity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
            Discover active job openings ranked by your resume's evidence-backed fit score.
          </p>
        </div>

        {!candidate && (
          <button
            onClick={onNavigateToProfile}
            className="btn-primary text-xs sm:text-sm py-2.5 px-5 shadow-sm self-start md:self-auto"
          >
            <Sparkles size={15} />
            <span>Upload Resume to Calculate Fit</span>
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="dash-card p-4 bg-white flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, department, skills..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setScoreFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                scoreFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setScoreFilter('STRONG')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                scoreFilter === 'STRONG' ? 'bg-emerald-50 text-emerald-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Strong (≥80%)
            </button>
            <button
              onClick={() => setScoreFilter('REVIEW')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                scoreFilter === 'REVIEW' ? 'bg-amber-50 text-amber-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Review (50–79%)
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="MATCH">Sort: Best Match</option>
            <option value="NEWEST">Sort: Newest</option>
            <option value="TITLE">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="dash-card p-12 bg-white text-center space-y-3">
          <Briefcase size={32} className="mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-slate-700">No jobs match your search.</h4>
          <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const match = matchMap.get(job.id)
            const score = match ? match.fit_score : null
            const isApplied = appliedJobIds.includes(job.id)

            const badgeColor =
              score === null
                ? 'bg-slate-50 text-slate-600 border-slate-200'
                : score >= 80
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : score >= 50
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'

            const statusText =
              score === null
                ? 'Fit Pending'
                : score >= 80
                ? 'Strong Match'
                : score >= 50
                ? 'Needs Review'
                : 'Low Fit'

            return (
              <div
                key={job.id}
                className="dash-card p-6 bg-white space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Department & Fit Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
                      <Building size={12} />
                      <span>{job.department || 'Engineering'}</span>
                    </span>

                    {score !== null ? (
                      <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-black border flex items-center gap-1.5 ${badgeColor}`}>
                        <span>{score}%</span>
                        <span>•</span>
                        <span>{statusText}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Upload resume for fit
                      </span>
                    )}
                  </div>

                  {/* Job Title & Location */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{job.location || 'Remote'}</span>
                      <span>•</span>
                      <span>{job.experience_level || 'Mid Level'}</span>
                    </div>
                  </div>

                  {/* Description Snippet */}
                  <p className="text-xs text-slate-600 font-sans line-clamp-2 leading-relaxed">
                    {job.job_description}
                  </p>

                  {/* Requirement Match Highlights */}
                  {match && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        Evidence Highlights
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {match.matched_requirements.slice(0, 3).map((r, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                          >
                            <CheckCircle2 size={10} />
                            <span>{r}</span>
                          </span>
                        ))}
                        {match.missing_requirements.slice(0, 1).map((r, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"
                          >
                            <XCircle size={10} />
                            <span>{r}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectJob(job)}
                    className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    View Job Spec →
                  </button>

                  {isApplied ? (
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Applied</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onApplyJob(job)}
                      disabled={!candidate}
                      className="btn-primary text-xs py-1.5 px-4 font-bold shadow-xs disabled:opacity-40"
                    >
                      <Send size={12} />
                      <span>Apply Now</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
