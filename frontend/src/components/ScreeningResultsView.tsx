import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Users,
  Star,
  Clock,
  Ban,
  ArrowUpDown,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Printer,
  PlusCircle,
  ChevronRight,
} from 'lucide-react'
import type { JobOpening, RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'
import CandidateDetailModal from './CandidateDetailModal'
import CandidateComparisonModal from './CandidateComparisonModal'
import ResponsibleAINotice from './ResponsibleAINotice'
import { saveRecruiterDecision } from '../utils/recruiterStore'

interface ScreeningResultsViewProps {
  job: JobOpening
  candidates: RankedCandidate[]
  onOpenNewScreening: () => void
  onUpdateCandidateDecision: (candidateId: string, decision: RecruiterDecisionStatus) => void
}

export default function ScreeningResultsView({
  job,
  candidates: initialCandidates,
  onOpenNewScreening,
  onUpdateCandidateDecision,
}: ScreeningResultsViewProps) {
  const [candidates, setCandidates] = useState<RankedCandidate[]>(initialCandidates)
  const [searchTerm, setSearchTerm] = useState('')
  const [fitFilter, setFitFilter] = useState<'ALL' | 'STRONG' | 'REVIEW' | 'LOW'>('ALL')
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'SHORTLISTED' | 'REVIEW' | 'REJECTED' | 'UNDECIDED'>('ALL')
  const [sortBy, setSortBy] = useState<'rank' | 'weighted' | 'critical' | 'name'>('rank')

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])
  const [activeCandidateForReview, setActiveCandidateForReview] = useState<RankedCandidate | null>(null)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)

  const handleUpdateDecision = (candidateId: string, decision: RecruiterDecisionStatus) => {
    saveRecruiterDecision(candidateId, decision)
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, recruiterDecision: decision } : c)),
    )
    if (activeCandidateForReview && activeCandidateForReview.id === candidateId) {
      setActiveCandidateForReview((prev) => (prev ? { ...prev, recruiterDecision: decision } : null))
    }
    onUpdateCandidateDecision(candidateId, decision)
  }

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSelectAllVisible = (visibleIds: string[]) => {
    if (selectedCandidateIds.length === visibleIds.length) {
      setSelectedCandidateIds([])
    } else {
      setSelectedCandidateIds(visibleIds)
    }
  }

  // Filter and sort candidates
  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.experienceSummary && c.experienceSummary.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFit =
      fitFilter === 'ALL'
        ? true
        : fitFilter === 'STRONG'
        ? c.weightedFitScore >= 80
        : fitFilter === 'REVIEW'
        ? c.weightedFitScore >= 50 && c.weightedFitScore < 80
        : c.weightedFitScore < 50

    const matchesDecision =
      decisionFilter === 'ALL' ? true : c.recruiterDecision === decisionFilter

    return matchesSearch && matchesFit && matchesDecision
  })

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'weighted') return b.weightedFitScore - a.weightedFitScore
    if (sortBy === 'critical') return b.criticalMatched - a.criticalMatched
    if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName)
    return a.rank - b.rank
  })

  const strongMatchesCount = candidates.filter((c) => c.weightedFitScore >= 80).length
  const reviewCount = candidates.filter((c) => c.weightedFitScore >= 50 && c.weightedFitScore < 80).length
  const lowFitCount = candidates.filter((c) => c.weightedFitScore < 50).length
  const shortlistedCount = candidates.filter((c) => c.recruiterDecision === 'SHORTLISTED').length

  const comparedCandidates = candidates.filter((c) => selectedCandidateIds.includes(c.id))

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global Actions ── */}
      <div className="dash-card p-6 sm:p-8 bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                JOB ID: {job.id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {job.department} • {job.location}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {job.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Screening Dashboard • {candidates.length} candidates evaluated against verified job requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewScreening}
              className="btn-primary text-xs py-2.5 px-4 shadow-sm"
            >
              <PlusCircle size={14} />
              <span>+ Add More Resumes</span>
            </button>
          </div>
        </div>

        {/* Responsible AI Notice */}
        <ResponsibleAINotice />
      </div>

      {/* ── Metric Cards Row (5 Columns) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="dash-card p-4 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
            TOTAL ANALYZED
          </span>
          <span className="text-2xl font-black text-slate-900">{candidates.length}</span>
          <span className="text-[11px] text-slate-500 block mt-1">100% Grounded</span>
        </div>

        <div className="dash-card p-4 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            STRONG MATCH
          </span>
          <span className="text-2xl font-black text-emerald-600">{strongMatchesCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Score ≥ 80%</span>
        </div>

        <div className="dash-card p-4 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 block mb-1">
            NEEDS REVIEW
          </span>
          <span className="text-2xl font-black text-amber-600">{reviewCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Score 50–79%</span>
        </div>

        <div className="dash-card p-4 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 block mb-1">
            LOW FIT
          </span>
          <span className="text-2xl font-black text-rose-600">{lowFitCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Score &lt; 50%</span>
        </div>

        <div className="dash-card p-4 bg-white border-blue-200 bg-blue-50/20">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block mb-1">
            SHORTLISTED
          </span>
          <span className="text-2xl font-black text-blue-700">{shortlistedCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Human Choice</span>
        </div>
      </div>

      {/* ── Multi-Select Batch Action Floating Bar ── */}
      {selectedCandidateIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold font-mono text-blue-400">
              {selectedCandidateIds.length} candidate(s) selected
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {selectedCandidateIds.length >= 2 && selectedCandidateIds.length <= 5 && (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="btn-primary py-1.5 px-3 text-xs bg-blue-500 hover:bg-blue-600"
              >
                <Users size={13} />
                <span>Compare Selected ({selectedCandidateIds.length})</span>
              </button>
            )}

            <button
              onClick={() => {
                selectedCandidateIds.forEach((id) => handleUpdateDecision(id, 'SHORTLISTED'))
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold transition-all text-xs flex items-center gap-1"
            >
              <Star size={12} />
              <span>Bulk Shortlist</span>
            </button>

            <button
              onClick={() => setSelectedCandidateIds([])}
              className="text-slate-400 hover:text-white text-xs px-2"
            >
              Deselect All
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Search, Filters, and Sorting Bar ── */}
      <div className="dash-card p-4 bg-white flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate or skill..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Fit Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFitFilter('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                fitFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              All Fit
            </button>
            <button
              onClick={() => setFitFilter('STRONG')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                fitFilter === 'STRONG' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Strong (≥80%)
            </button>
            <button
              onClick={() => setFitFilter('REVIEW')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                fitFilter === 'REVIEW' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Review (50-79%)
            </button>
            <button
              onClick={() => setFitFilter('LOW')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                fitFilter === 'LOW' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Low (&lt;50%)
            </button>
          </div>

          {/* Decision Filter */}
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value as any)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Decisions</option>
            <option value="SHORTLISTED">⭐ Shortlisted</option>
            <option value="REVIEW">⏳ Needs Review</option>
            <option value="REJECTED">✕ Rejected</option>
            <option value="UNDECIDED">Undecided</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="rank">Sort: Rank (Default)</option>
            <option value="weighted">Sort: Weighted Score</option>
            <option value="critical">Sort: Critical Requirements</option>
            <option value="name">Sort: Candidate Name</option>
          </select>
        </div>
      </div>

      {/* ── Main Ranked Candidates Table ── */}
      <div className="dash-card overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-400 font-mono uppercase text-[10px]">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedCandidateIds.length === filtered.length}
                    onChange={() => handleSelectAllVisible(filtered.map((c) => c.id))}
                    className="rounded text-blue-600"
                  />
                </th>
                <th className="p-3.5 w-16">Rank</th>
                <th className="p-3.5 min-w-[220px]">Candidate</th>
                <th className="p-3.5">Fit Score</th>
                <th className="p-3.5">Critical Reqs</th>
                <th className="p-3.5 min-w-[180px]">Experience</th>
                <th className="p-3.5">Evidence</th>
                <th className="p-3.5">AI Rating</th>
                <th className="p-3.5 min-w-[140px]">Recruiter Decision</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                    No candidates match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((cand) => {
                  const isSelected = selectedCandidateIds.includes(cand.id)
                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCandidate(cand.id)}
                          className="rounded text-blue-600"
                        />
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-500">
                        #{cand.rank}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <button
                            onClick={() => setActiveCandidateForReview(cand)}
                            className="font-bold text-slate-900 hover:text-blue-600 text-left truncate block"
                          >
                            {cand.candidateName}
                          </button>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {cand.email ?? cand.filename}
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-sm font-black font-mono text-blue-600">
                            {cand.weightedFitScore}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Raw: {cand.rawFitScore}%
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                            cand.criticalMatched === cand.criticalTotal
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {cand.criticalMatched}/{cand.criticalTotal} Met
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700 truncate max-w-[200px]">
                        {cand.experienceSummary}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-bold text-[10px] uppercase font-mono ${
                            cand.evidenceQuality === 'HIGH'
                              ? 'text-emerald-700'
                              : cand.evidenceQuality === 'MEDIUM'
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {cand.evidenceQuality}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                            cand.aiRecommendation === 'STRONG MATCH'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : cand.aiRecommendation === 'REVIEW'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {cand.aiRecommendation}
                        </span>
                      </td>

                      {/* Recruiter Human Decision Dropdown */}
                      <td className="p-3.5">
                        <select
                          value={cand.recruiterDecision}
                          onChange={(e) =>
                            handleUpdateDecision(cand.id, e.target.value as RecruiterDecisionStatus)
                          }
                          className={`px-2 py-1 rounded text-xs font-bold font-mono outline-none border transition-all ${
                            cand.recruiterDecision === 'SHORTLISTED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : cand.recruiterDecision === 'REVIEW'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : cand.recruiterDecision === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="UNDECIDED">Undecided</option>
                          <option value="SHORTLISTED">⭐ Shortlisted</option>
                          <option value="REVIEW">⏳ Needs Review</option>
                          <option value="REJECTED">✕ Rejected</option>
                        </select>
                      </td>

                      {/* Review Action */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setActiveCandidateForReview(cand)}
                          className="btn-secondary py-1 px-2.5 text-xs font-semibold"
                        >
                          <span>Review</span>
                          <ChevronRight size={12} />
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

      {/* ── Candidate Evaluation Detail Modal ── */}
      {activeCandidateForReview && (
        <CandidateDetailModal
          candidate={activeCandidateForReview}
          jobTitle={job.title}
          onClose={() => setActiveCandidateForReview(null)}
          onUpdateDecision={handleUpdateDecision}
        />
      )}

      {/* ── Candidate Comparison Modal ── */}
      {isCompareModalOpen && comparedCandidates.length >= 2 && (
        <CandidateComparisonModal
          candidates={comparedCandidates}
          onClose={() => setIsCompareModalOpen(false)}
          onSelectCandidate={(c) => {
            setIsCompareModalOpen(false)
            setActiveCandidateForReview(c)
          }}
          onUpdateDecision={handleUpdateDecision}
        />
      )}
    </div>
  )
}
