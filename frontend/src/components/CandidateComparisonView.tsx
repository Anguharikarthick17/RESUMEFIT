import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle2, AlertTriangle, XCircle, FileText, ArrowRight } from 'lucide-react'
import type { AnalysisSnapshot } from '../types/intelligence'
import type { RequirementMatch } from '../types/resume'

interface CandidateComparisonViewProps {
  currentSnapshot: AnalysisSnapshot
  history: AnalysisSnapshot[]
  onSelectCandidate?: (snapshot: AnalysisSnapshot) => void
}

export default function CandidateComparisonView({
  currentSnapshot,
  history,
  onSelectCandidate,
}: CandidateComparisonViewProps) {
  // Select up to 3 candidates to compare
  const otherCandidates = history.filter((h) => h.analysisId !== currentSnapshot.analysisId)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    currentSnapshot.analysisId,
    ...(otherCandidates.slice(0, 2).map((c) => c.analysisId)),
  ])

  const toggleCandidate = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id))
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id])
      }
    }
  }

  const allAvailable = [currentSnapshot, ...otherCandidates]
  const comparedCandidates = allAvailable.filter((c) => selectedIds.includes(c.analysisId))

  // Collect unique requirements from the compared candidates
  const allReqTitles = Array.from(
    new Set(
      comparedCandidates.flatMap((c) =>
        Array.isArray(c.data?.requirements) ? c.data.requirements.map((r) => r.requirement) : [],
      ),
    ),
  )


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Recruiter Multi-Candidate Intelligence
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            Compare Candidates
          </h3>
        </div>

        <div className="text-xs text-[#777777] font-mono">
          Side-by-side evidence matrix • Compare up to 3 candidates
        </div>
      </div>

      {/* Candidate Selector Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-[#666666] mr-1">Select Candidates:</span>
        {allAvailable.map((c) => {
          const isSelected = selectedIds.includes(c.analysisId)
          return (
            <button
              key={c.analysisId}
              onClick={() => toggleCandidate(c.analysisId)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-black text-white border-black shadow-2xs'
                  : 'bg-white text-[#333333] hover:bg-[#F5F5F4] border-[#E5E5E5]'
              }`}
            >
              <span>{c.candidateName}</span>
              <span className="font-mono text-[10px] opacity-80">({c.fitScore}%)</span>
            </button>
          )
        })}
      </div>

      {/* Comparison Matrix Table */}
      <div className="dash-card overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header: Candidate Summary Cards */}
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F8F8F7]">
                <th className="p-4 font-bold text-[#777777] font-mono uppercase tracking-wider w-1/3 min-w-[220px]">
                  Job Requirement
                </th>
                {comparedCandidates.map((cand) => (
                  <th key={cand.analysisId} className="p-4 font-bold text-[#111111] min-w-[180px]">
                    <div className="space-y-1">
                      <div className="text-sm font-black truncate">{cand.candidateName}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-[#111111]">
                          {cand.fitScore}%
                        </span>
                        <span className="text-[10px] text-[#777777] font-mono">
                          (W: {cand.weightedScore}%)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#777777] block truncate">
                        ID: {cand.analysisId}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Requirements Rows */}
            <tbody className="divide-y divide-[#E5E5E5]">
              {allReqTitles.map((reqTitle) => (
                <tr key={reqTitle} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="p-4 font-bold text-[#111111] leading-snug">
                    {reqTitle}
                  </td>

                  {comparedCandidates.map((cand) => {
                    const match = cand.data.requirements.find((r) => r.requirement === reqTitle)
                    const status = match ? match.match_status : 'MISSING'

                    return (
                      <td key={cand.analysisId} className="p-4">
                        {status === 'MATCHED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} className="text-emerald-600" /> Matched
                          </span>
                        ) : status === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle size={11} className="text-amber-600" /> Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle size={11} className="text-rose-600" /> Missing
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
