import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  ExternalLink,
  Download,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Building,
  MapPin,
  ArrowRight,
  PlusCircle,
} from 'lucide-react'
import type { JobOpening, RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'
import CandidateDetailModal from './CandidateDetailModal'
import CandidateComparisonModal from './CandidateComparisonModal'
import ErrorBoundary from './ErrorBoundary'

interface ScreeningResultsViewProps {
  job: JobOpening
  candidates: RankedCandidate[]
  onOpenNewScreening: () => void
  onUpdateCandidateDecision: (candidateId: string, decision: RecruiterDecisionStatus) => void
}

// ── Defensive Helper Getters ──────────────────────────────────────────────────
function getCandidateName(c: RankedCandidate): string {
  return (c.candidateName || c.name || c.data?.candidate?.full_name || 'Candidate').trim()
}

function getCandidateEmail(c: RankedCandidate): string {
  return (c.email || c.data?.candidate?.email || '').trim()
}

function getCandidateScore(c: RankedCandidate): number {
  if (typeof c.weightedFitScore === 'number') return c.weightedFitScore
  if (typeof c.rawFitScore === 'number') return c.rawFitScore
  if (typeof c.fitScore === 'number') return c.fitScore
  return c.data?.fit_score?.fit_score ?? 0
}

function getCandidateSkills(c: RankedCandidate): string[] {
  if (Array.isArray(c.skills) && c.skills.length > 0) return c.skills
  if (Array.isArray(c.data?.candidate?.skills) && c.data.candidate.skills.length > 0) return c.data.candidate.skills
  const skillsField = c.data?.fields?.find((f) => f.field_id === 'SKILLS-LIST')
  if (skillsField?.value) return skillsField.value.split(',').map((s) => s.trim())
  return []
}

function getCriticalMet(c: RankedCandidate): number {
  if (typeof c.criticalMatched === 'number') return c.criticalMatched
  if (typeof c.criticalRequirementsMet === 'number') return c.criticalRequirementsMet
  return c.data?.fit_score?.matched ?? 0
}

function getCriticalTotal(c: RankedCandidate): number {
  if (typeof c.criticalTotal === 'number' && c.criticalTotal > 0) return c.criticalTotal
  if (typeof c.criticalRequirementsTotal === 'number' && c.criticalRequirementsTotal > 0) return c.criticalRequirementsTotal
  return c.data?.fit_score?.total || 1
}

function getDecision(c: RankedCandidate): RecruiterDecisionStatus {
  return c.recruiterDecision || 'UNDECIDED'
}

export default function ScreeningResultsView({
  job,
  candidates = [],
  onOpenNewScreening,
  onUpdateCandidateDecision,
}: ScreeningResultsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'STRONG' | 'REVIEW' | 'LOW' | 'SHORTLISTED' | 'UNDECIDED'>('ALL')
  const [sortBy, setSortBy] = useState<'RANK' | 'SCORE' | 'EXPERIENCE' | 'CRITICAL'>('RANK')

  // Selected candidate for deep review modal
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null)

  // Multi-select for side-by-side comparison
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)

  // Filter and Sort Candidates (Defensive against nulls)
  const filteredCandidates = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase()

    return (candidates || [])
      .filter((c) => {
        if (!c) return false

        const name = getCandidateName(c).toLowerCase()
        const email = getCandidateEmail(c).toLowerCase()
        const skills = getCandidateSkills(c)

        const matchesQuery =
          !q ||
          name.includes(q) ||
          email.includes(q) ||
          skills.some((s) => (s || '').toLowerCase().includes(q))

        if (!matchesQuery) return false

        const score = getCandidateScore(c)
        const decision = getDecision(c)

        if (statusFilter === 'STRONG') return score >= 80
        if (statusFilter === 'REVIEW') return score >= 50 && score < 80
        if (statusFilter === 'LOW') return score < 50
        if (statusFilter === 'SHORTLISTED') return decision === 'SHORTLISTED'
        if (statusFilter === 'UNDECIDED') return decision === 'UNDECIDED'

        return true
      })
      .sort((a, b) => {
        const scoreA = getCandidateScore(a)
        const scoreB = getCandidateScore(b)
        const critA = getCriticalMet(a)
        const critB = getCriticalMet(b)

        if (sortBy === 'SCORE') return scoreB - scoreA
        if (sortBy === 'CRITICAL') return critB - critA
        if (sortBy === 'EXPERIENCE') return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0)
        return (a.rank || 0) - (b.rank || 0)
      })
  }, [candidates, searchQuery, statusFilter, sortBy])

  // Count summaries
  const strongCount = (candidates || []).filter((c) => getCandidateScore(c) >= 80).length
  const reviewCount = (candidates || []).filter((c) => {
    const s = getCandidateScore(c)
    return s >= 50 && s < 80
  }).length
  const lowCount = (candidates || []).filter((c) => getCandidateScore(c) < 50).length
  const shortlistedCount = (candidates || []).filter((c) => getDecision(c) === 'SHORTLISTED').length

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 5 ? [...prev, id] : prev,
    )
  }

  const comparedCandidates = (candidates || []).filter((c) => selectedCandidateIds.includes(c.id))

  return (
    <div className="space-y-6">
      {/* ── Top Header Card ── */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#F5F5F4] text-[#111111] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
              {job?.department || 'Engineering'}
            </span>
            <span className="text-xs text-[#777777] font-mono flex items-center gap-1">
              <MapPin size={12} />
              <span>{job?.location || 'Remote'}</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            {job?.title || 'Job Screening'}
          </h2>

          <p className="text-xs sm:text-sm text-[#666666] font-sans max-w-3xl line-clamp-1">
            {job?.job_description || 'Screening candidate resumes against target job description.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-shrink-0">
          {selectedCandidateIds.length >= 2 && (
            <button
              onClick={() => setIsComparisonOpen(true)}
              className="btn-secondary text-xs py-2 px-3.5 font-bold"
            >
              <Layers size={14} />
              <span>Compare Selected ({selectedCandidateIds.length})</span>
            </button>
          )}

          <button
            onClick={onOpenNewScreening}
            className="btn-primary text-xs py-2 px-4 shadow-sm font-bold"
          >
            <PlusCircle size={14} />
            <span>+ Screen More Resumes</span>
          </button>
        </div>
      </div>

      {/* ── Summary Tiers Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`dash-card p-4 bg-white cursor-pointer transition-all ${
            statusFilter === 'ALL' ? 'border-black ring-1 ring-black' : ''
          }`}
        >
          <span className="text-[10px] font-mono font-bold uppercase text-[#777777] block">
            Total Analyzed
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black font-mono text-[#111111]">
              {(candidates || []).length}
            </span>
            <span className="text-[10px] text-[#777777] font-medium">candidates</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('STRONG')}
          className={`dash-card p-4 bg-white cursor-pointer transition-all ${
            statusFilter === 'STRONG' ? 'border-emerald-600 ring-1 ring-emerald-600' : ''
          }`}
        >
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block">
            Strong Match (≥80%)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black font-mono text-[#111111]">
              {strongCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">high fit</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('REVIEW')}
          className={`dash-card p-4 bg-white cursor-pointer transition-all ${
            statusFilter === 'REVIEW' ? 'border-amber-600 ring-1 ring-amber-600' : ''
          }`}
        >
          <span className="text-[10px] font-mono font-bold uppercase text-amber-700 block">
            Needs Review (50–79%)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black font-mono text-[#111111]">
              {reviewCount}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">moderate</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('SHORTLISTED')}
          className={`dash-card p-4 bg-white cursor-pointer transition-all ${
            statusFilter === 'SHORTLISTED' ? 'border-black ring-1 ring-black' : ''
          }`}
        >
          <span className="text-[10px] font-mono font-bold uppercase text-[#111111] block">
            Shortlisted (Approved)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black font-mono text-[#111111]">
              {shortlistedCount}
            </span>
            <span className="text-[10px] text-[#111111] font-medium">recruiter picked</span>
          </div>
        </div>
      </div>

      {/* ── Table Filter & Search Controls ── */}
      <div className="dash-card p-4 bg-white flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, email, skills..."
            className="w-full pl-9 pr-3 py-2 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs text-[#111111] placeholder:text-[#888888] outline-none focus:border-black focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-[#F5F5F4] border border-[#E5E5E5] rounded-lg p-0.5 text-xs font-semibold text-[#555555]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'ALL' ? 'bg-black text-white shadow-xs font-bold' : 'hover:text-black'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('STRONG')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'STRONG' ? 'bg-emerald-50 text-emerald-800 shadow-xs font-bold' : 'hover:text-black'
              }`}
            >
              Strong
            </button>
            <button
              onClick={() => setStatusFilter('REVIEW')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'REVIEW' ? 'bg-amber-50 text-amber-800 shadow-xs font-bold' : 'hover:text-black'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => setStatusFilter('LOW')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'LOW' ? 'bg-rose-50 text-rose-800 shadow-xs font-bold' : 'hover:text-black'
              }`}
            >
              Low Fit
            </button>
            <button
              onClick={() => setStatusFilter('SHORTLISTED')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'SHORTLISTED' ? 'bg-black text-white shadow-xs font-bold' : 'hover:text-black'
              }`}
            >
              Shortlisted
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs font-semibold text-[#111111] outline-none focus:border-black"
          >
            <option value="RANK">Sort: Rank (Best Fit)</option>
            <option value="SCORE">Sort: Score</option>
            <option value="CRITICAL">Sort: Critical Reqs Met</option>
            <option value="EXPERIENCE">Sort: Experience</option>
          </select>
        </div>
      </div>

      {/* ── Candidates Data Table ── */}
      <div className="dash-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F8F7] text-[#777777] font-mono font-bold border-b border-[#E5E5E5] uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Compare</th>
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Candidate Profile</th>
                <th className="py-3 px-4">Fit Score</th>
                <th className="py-3 px-4">Critical Reqs</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">AI Rating</th>
                <th className="py-3 px-4">Recruiter Decision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#777777]">
                    <div className="space-y-2">
                      <Users size={28} className="mx-auto text-[#AAAAAA]" />
                      <p className="font-semibold text-sm text-[#111111]">
                        {candidates.length === 0
                          ? 'No candidates have been screened for this job yet.'
                          : 'No candidates match the selected filters.'}
                      </p>
                      <p className="text-xs text-[#777777]">
                        {candidates.length === 0
                          ? 'Click "+ Screen More Resumes" to evaluate candidate resumes.'
                          : 'Try adjusting your search query or status filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand, idx) => {
                  const isChecked = selectedCandidateIds.includes(cand.id)
                  const name = getCandidateName(cand)
                  const email = getCandidateEmail(cand)
                  const score = getCandidateScore(cand)
                  const critMet = getCriticalMet(cand)
                  const critTotal = getCriticalTotal(cand)
                  const decision = getDecision(cand)

                  const fitColor =
                    score >= 80
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : score >= 50
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'

                  return (
                    <tr
                      key={cand.id || `cand-${idx}`}
                      className={`hover:bg-[#FAFAFA] transition-colors ${
                        decision === 'SHORTLISTED' ? 'bg-[#FDFDFD]' : ''
                      }`}
                    >
                      {/* Checkbox for batch compare */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectCandidate(cand.id)}
                          className="rounded border-[#D4D4D4] text-black focus:ring-black cursor-pointer"
                        />
                      </td>

                      {/* Rank */}
                      <td className="py-3.5 px-4 font-mono font-black text-[#111111] text-sm">
                        #{cand.rank || idx + 1}
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => setSelectedCandidate(cand)}
                            className="font-bold text-[#111111] text-sm hover:underline cursor-pointer"
                          >
                            {name}
                          </span>
                          {cand.reviewFlags && cand.reviewFlags.length > 0 && (
                            <span
                              title={cand.reviewFlags.join('\n')}
                              className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#F5F5F4] text-[#111111] border border-[#E5E5E5] cursor-help"
                            >
                              {cand.reviewFlags.length} Audit
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#777777] font-mono">
                          {email || 'No email provided'}
                        </p>
                      </td>

                      {/* Fit Score */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono font-black text-sm px-2.5 py-1 rounded-md border border-[#E5E5E5] bg-[#F8F8F7] text-[#111111]">
                          <span>{score}%</span>
                        </div>
                      </td>

                      {/* Critical Requirements Met */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="font-bold text-[#111111]">
                          {critMet} / {critTotal}
                        </span>
                        <span className="text-[10px] text-[#777777] block">Critical met</span>
                      </td>

                      {/* Experience */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <span className="font-semibold text-[#111111] block">
                          {cand.yearsOfExperience ? `${cand.yearsOfExperience} Years` : 'Detected'}
                        </span>
                        <span className="text-[10px] text-[#777777] font-mono truncate max-w-[140px] block">
                          {cand.mostRecentRole || cand.currentTitle || 'Professional'}
                        </span>
                      </td>

                      {/* Evidence Quality */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            cand.evidenceQuality === 'HIGH'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : cand.evidenceQuality === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-[#F5F5F4] text-[#111111] border-[#E5E5E5]'
                          }`}
                        >
                          {cand.evidenceQuality || 'VERIFIED'}
                        </span>
                      </td>

                      {/* AI Rating */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${fitColor}`}
                        >
                          {cand.aiRecommendation || (score >= 80 ? 'STRONG MATCH' : score >= 50 ? 'REVIEW' : 'LOW FIT')}
                        </span>
                      </td>

                      {/* Recruiter Decision Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={decision}
                          onChange={(e) =>
                            onUpdateCandidateDecision(
                              cand.id,
                              e.target.value as RecruiterDecisionStatus,
                            )
                          }
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer transition-colors ${
                            decision === 'SHORTLISTED'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : decision === 'REVIEW'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : decision === 'REJECTED'
                              ? 'bg-rose-50 text-rose-900 border-rose-300'
                              : 'bg-[#F8F8F7] text-[#111111] border-[#E5E5E5]'
                          }`}
                        >
                          <option value="UNDECIDED">Undecided</option>
                          <option value="SHORTLISTED">⭐ Shortlist</option>
                          <option value="REVIEW">⏳ Review</option>
                          <option value="REJECTED">✕ Reject</option>
                        </select>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCandidate(cand)}
                          className="btn-secondary text-[11px] py-1 px-3 font-bold"
                        >
                          <span>Review</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Candidate Deep Detail Modal ── */}
      {selectedCandidate && (
        <ErrorBoundary title="Candidate Detail Notice">
          <CandidateDetailModal
            candidate={selectedCandidate}
            jobDescription={job?.job_description || ''}
            onClose={() => setSelectedCandidate(null)}
            onUpdateDecision={(decision) => {
              onUpdateCandidateDecision(selectedCandidate.id, decision)
              setSelectedCandidate((prev) => (prev ? { ...prev, recruiterDecision: decision } : null))
            }}
          />
        </ErrorBoundary>
      )}

      {/* ── Side-by-Side Comparison Modal ── */}
      {isComparisonOpen && comparedCandidates.length >= 2 && (
        <ErrorBoundary title="Comparison Notice">
          <CandidateComparisonModal
            candidates={comparedCandidates}
            onClose={() => setIsComparisonOpen(false)}
          />
        </ErrorBoundary>
      )}
    </div>
  )
}
