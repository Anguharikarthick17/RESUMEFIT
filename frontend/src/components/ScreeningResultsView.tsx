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

interface ScreeningResultsViewProps {
  job: JobOpening
  candidates: RankedCandidate[]
  onOpenNewScreening: () => void
  onUpdateCandidateDecision: (candidateId: string, decision: RecruiterDecisionStatus) => void
}

export default function ScreeningResultsView({
  job,
  candidates,
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

  // Filter and Sort Candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        const matchesQuery =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))

        if (!matchesQuery) return false

        if (statusFilter === 'STRONG') return c.fitScore >= 80
        if (statusFilter === 'REVIEW') return c.fitScore >= 50 && c.fitScore < 80
        if (statusFilter === 'LOW') return c.fitScore < 50
        if (statusFilter === 'SHORTLISTED') return c.recruiterDecision === 'SHORTLISTED'
        if (statusFilter === 'UNDECIDED') return c.recruiterDecision === 'UNDECIDED' || !c.recruiterDecision

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE') return b.fitScore - a.fitScore
        if (sortBy === 'CRITICAL') return b.criticalRequirementsMet - a.criticalRequirementsMet
        if (sortBy === 'EXPERIENCE') return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0)
        return a.rank - b.rank
      })
  }, [candidates, searchQuery, statusFilter, sortBy])

  // Count summaries
  const strongCount = candidates.filter((c) => c.fitScore >= 80).length
  const reviewCount = candidates.filter((c) => c.fitScore >= 50 && c.fitScore < 80).length
  const lowCount = candidates.filter((c) => c.fitScore < 50).length
  const shortlistedCount = candidates.filter((c) => c.recruiterDecision === 'SHORTLISTED').length

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 5 ? [...prev, id] : prev,
    )
  }

  const comparedCandidates = candidates.filter((c) => selectedCandidateIds.includes(c.id))

  return (
    <div className="space-y-6">
      {/* ── Top Header Card ── */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#F5F5F4] text-[#111111] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
              {job.department || 'Engineering'}
            </span>
            <span className="text-xs text-[#777777] font-mono flex items-center gap-1">
              <MapPin size={12} />
              <span>{job.location || 'Remote'}</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            {job.title}
          </h2>

          <p className="text-xs sm:text-sm text-[#666666] font-sans max-w-3xl line-clamp-1">
            {job.job_description}
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
              {candidates.length}
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
                      <p className="font-semibold text-sm text-[#111111]">No candidates match the selected filters.</p>
                      <p className="text-xs text-[#777777]">Try adjusting your search query or status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const isChecked = selectedCandidateIds.includes(cand.id)

                  const fitColor =
                    cand.fitScore >= 80
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : cand.fitScore >= 50
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'

                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-[#FAFAFA] transition-colors ${
                        cand.recruiterDecision === 'SHORTLISTED' ? 'bg-[#FDFDFD]' : ''
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
                        #{cand.rank}
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => setSelectedCandidate(cand)}
                            className="font-bold text-[#111111] text-sm hover:underline cursor-pointer"
                          >
                            {cand.name}
                          </span>
                          {cand.flags && cand.flags.length > 0 && (
                            <span
                              title={cand.flags.map((f) => f.title).join('\n')}
                              className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#F5F5F4] text-[#111111] border border-[#E5E5E5] cursor-help"
                            >
                              {cand.flags.length} Audit
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#777777] font-mono">
                          {cand.email || 'No email provided'}
                        </p>
                      </td>

                      {/* Fit Score */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono font-black text-sm px-2.5 py-1 rounded-md border border-[#E5E5E5] bg-[#F8F8F7] text-[#111111]">
                          <span>{cand.fitScore}%</span>
                        </div>
                      </td>

                      {/* Critical Requirements Met */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="font-bold text-[#111111]">
                          {cand.criticalRequirementsMet} / {cand.criticalRequirementsTotal}
                        </span>
                        <span className="text-[10px] text-[#777777] block">Critical met</span>
                      </td>

                      {/* Experience */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <span className="font-semibold text-[#111111] block">
                          {cand.yearsOfExperience ? `${cand.yearsOfExperience} Years` : 'Detected'}
                        </span>
                        <span className="text-[10px] text-[#777777] font-mono truncate max-w-[140px] block">
                          {cand.currentTitle || 'Professional'}
                        </span>
                      </td>

                      {/* Evidence Quality */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            cand.evidenceStrength === 'STRONG'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : cand.evidenceStrength === 'MODERATE'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-[#F5F5F4] text-[#111111] border-[#E5E5E5]'
                          }`}
                        >
                          {cand.evidenceStrength || 'VERIFIED'}
                        </span>
                      </td>

                      {/* AI Rating */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${fitColor}`}
                        >
                          {cand.aiRecommendation || (cand.fitScore >= 80 ? 'STRONG MATCH' : cand.fitScore >= 50 ? 'REVIEW' : 'LOW FIT')}
                        </span>
                      </td>

                      {/* Recruiter Decision Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={cand.recruiterDecision || 'UNDECIDED'}
                          onChange={(e) =>
                            onUpdateCandidateDecision(
                              cand.id,
                              e.target.value as RecruiterDecisionStatus,
                            )
                          }
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer transition-colors ${
                            cand.recruiterDecision === 'SHORTLISTED'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : cand.recruiterDecision === 'REVIEW'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : cand.recruiterDecision === 'REJECTED'
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
        <CandidateDetailModal
          candidate={selectedCandidate}
          jobDescription={job.job_description}
          onClose={() => setSelectedCandidate(null)}
          onUpdateDecision={(decision) => {
            onUpdateCandidateDecision(selectedCandidate.id, decision)
            setSelectedCandidate((prev) => (prev ? { ...prev, recruiterDecision: decision } : null))
          }}
        />
      )}

      {/* ── Side-by-Side Comparison Modal ── */}
      {isComparisonOpen && comparedCandidates.length >= 2 && (
        <CandidateComparisonModal
          candidates={comparedCandidates}
          onClose={() => setIsComparisonOpen(false)}
        />
      )}
    </div>
  )
}
