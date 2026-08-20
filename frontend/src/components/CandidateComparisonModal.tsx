import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, XCircle, Users, Star, Clock, Ban } from 'lucide-react'
import type { RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'

interface CandidateComparisonModalProps {
  candidates: RankedCandidate[]
  onClose: () => void
  onSelectCandidate?: (candidate: RankedCandidate) => void
  onUpdateDecision?: (candidateId: string, decision: RecruiterDecisionStatus) => void
}

export default function CandidateComparisonModal({
  candidates = [],
  onClose,
  onSelectCandidate,
  onUpdateDecision,
}: CandidateComparisonModalProps) {
  const allReqTitles = Array.from(
    new Set(
      candidates.flatMap((c) =>
        Array.isArray(c.data?.requirements) ? c.data.requirements.map((r) => r.requirement) : [],
      ),
    ),
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E5E5E5]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5] px-2.5 py-0.5 rounded">
              Recruiter Intelligence Matrix
            </span>
            <h3 className="text-xl font-black text-[#111111] mt-1">
              Side-by-Side Candidate Comparison ({candidates.length} Candidates)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#777777] hover:text-[#111111] rounded-lg hover:bg-[#F5F5F4] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="dash-card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#F8F8F7]">
                  <th className="p-4 font-bold text-[#777777] font-mono uppercase tracking-wider w-1/4 min-w-[200px]">
                    Requirement
                  </th>
                  {candidates.map((cand, idx) => {
                    const name = cand.candidateName || cand.name || cand.data?.candidate?.full_name || `Candidate ${idx + 1}`
                    const score = typeof cand.weightedFitScore === 'number' ? cand.weightedFitScore : typeof cand.rawFitScore === 'number' ? cand.rawFitScore : cand.fitScore ?? (cand.data?.fit_score?.fit_score || 0)
                    const decision = cand.recruiterDecision || 'UNDECIDED'

                    return (
                      <th key={cand.id || `cmp-${idx}`} className="p-4 font-bold text-[#111111] min-w-[180px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-[#111111] bg-[#F5F5F4] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                              Rank #{cand.rank || idx + 1}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                                decision === 'SHORTLISTED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : decision === 'REVIEW'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-[#F5F5F4] text-[#777777] border-[#E5E5E5]'
                              }`}
                            >
                              {decision}
                            </span>
                          </div>

                          <div className="text-sm font-black truncate">{name}</div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black font-mono text-[#111111]">
                              {score}%
                            </span>
                          </div>

                          {onUpdateDecision && (
                            <div className="flex items-center gap-1 pt-1">
                              <button
                                onClick={() => onUpdateDecision(cand.id, 'SHORTLISTED')}
                                className="p-1 text-[10px] rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                                title="Shortlist"
                              >
                                <Star size={11} />
                              </button>
                              <button
                                onClick={() => onUpdateDecision(cand.id, 'REVIEW')}
                                className="p-1 text-[10px] rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                                title="Review"
                              >
                                <Clock size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5E5E5]">
                {allReqTitles.length === 0 ? (
                  <tr>
                    <td colSpan={candidates.length + 1} className="p-6 text-center text-[#777777]">
                      No requirement criteria extracted for comparison.
                    </td>
                  </tr>
                ) : (
                  allReqTitles.map((reqTitle) => (
                    <tr key={reqTitle} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="p-4 font-bold text-[#111111] leading-snug">
                        {reqTitle}
                      </td>

                      {candidates.map((cand, idx) => {
                        const reqs = cand.data?.requirements || []
                        const match = reqs.find((r) => r.requirement === reqTitle)
                        const status = match ? match.match_status : 'MISSING'

                        return (
                          <td key={cand.id || `match-${idx}`} className="p-4">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
