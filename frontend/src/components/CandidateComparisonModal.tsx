import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, XCircle, Users, Star, Clock, Ban } from 'lucide-react'
import type { RankedCandidate, RecruiterDecisionStatus } from '../types/recruiter'

interface CandidateComparisonModalProps {
  candidates: RankedCandidate[]
  onClose: () => void
  onSelectCandidate: (candidate: RankedCandidate) => void
  onUpdateDecision: (candidateId: string, decision: RecruiterDecisionStatus) => void
}

export default function CandidateComparisonModal({
  candidates,
  onClose,
  onSelectCandidate,
  onUpdateDecision,
}: CandidateComparisonModalProps) {
  // Collect all unique requirement titles across all compared candidates
  const allReqTitles = Array.from(
    new Set(candidates.flatMap((c) => c.data.requirements.map((r) => r.requirement))),
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
              Recruiter Intelligence Matrix
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Side-by-Side Candidate Comparison ({candidates.length} Candidates)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="dash-card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              {/* Header row with candidate cards */}
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="p-4 font-bold text-slate-400 font-mono uppercase tracking-wider w-1/4 min-w-[200px]">
                    Requirement
                  </th>
                  {candidates.map((cand) => (
                    <th key={cand.id} className="p-4 font-bold text-slate-900 min-w-[180px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Rank #{cand.rank}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                              cand.recruiterDecision === 'SHORTLISTED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : cand.recruiterDecision === 'REVIEW'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {cand.recruiterDecision}
                          </span>
                        </div>

                        <div className="text-sm font-black truncate">{cand.candidateName}</div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black font-mono text-blue-600">
                            {cand.weightedFitScore}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            (Raw: {cand.rawFitScore}%)
                          </span>
                        </div>

                        {/* Decision buttons */}
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
                          <button
                            onClick={() => onSelectCandidate(cand)}
                            className="text-[10px] font-semibold text-blue-600 hover:underline ml-1"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Requirements matching rows */}
              <tbody className="divide-y divide-slate-100">
                {allReqTitles.map((reqTitle) => (
                  <tr key={reqTitle} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 leading-snug">
                      {reqTitle}
                    </td>

                    {candidates.map((cand) => {
                      const match = cand.data.requirements.find((r) => r.requirement === reqTitle)
                      const status = match ? match.match_status : 'MISSING'

                      return (
                        <td key={cand.id} className="p-4">
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

        {/* Key Grounded Differences */}
        <div className="dash-card p-5 bg-slate-50/60 border border-slate-200 space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Key Differentiating Factors
          </span>
          <div className="grid md:grid-cols-3 gap-3 text-xs pt-1">
            {candidates.slice(0, 3).map((cand) => (
              <div key={cand.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">{cand.candidateName} (Rank #{cand.rank})</div>
                <p className="text-slate-600">
                  {cand.criticalMatched === cand.criticalTotal
                    ? '✓ 100% Critical requirement coverage satisfied.'
                    : `⚠ Satisfies ${cand.criticalMatched} of ${cand.criticalTotal} critical requirements.`}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Experience: {cand.experienceSummary}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
