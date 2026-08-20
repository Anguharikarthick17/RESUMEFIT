import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertTriangle, XCircle, Star } from 'lucide-react'
import type { RankedCandidate } from '../types/recruiter'

interface ScreeningAnalyticsViewProps {
  jobTitle: string
  candidates: RankedCandidate[]
}

export default function ScreeningAnalyticsView({ jobTitle, candidates }: ScreeningAnalyticsViewProps) {
  const total = candidates.length || 1

  const strongCount = candidates.filter((c) => c.weightedFitScore >= 80).length
  const reviewCount = candidates.filter((c) => c.weightedFitScore >= 50 && c.weightedFitScore < 80).length
  const lowCount = candidates.filter((c) => c.weightedFitScore < 50).length
  const shortlistedCount = candidates.filter((c) => c.recruiterDecision === 'SHORTLISTED').length

  const strongPct = Math.round((strongCount / total) * 100)
  const reviewPct = Math.round((reviewCount / total) * 100)
  const lowPct = Math.round((lowCount / total) * 100)

  // Compute Requirement Coverage across all candidates
  const allReqsMap: Record<string, { matched: number; partial: number; total: number }> = {}

  for (const c of candidates) {
    for (const r of c.data.requirements) {
      if (!allReqsMap[r.requirement]) {
        allReqsMap[r.requirement] = { matched: 0, partial: 0, total: 0 }
      }
      allReqsMap[r.requirement].total++
      if (r.match_status === 'MATCHED') allReqsMap[r.requirement].matched++
      else if (r.match_status === 'PARTIAL') allReqsMap[r.requirement].partial++
    }
  }

  const reqCoverageList = Object.entries(allReqsMap).map(([req, counts]) => {
    const pct = Math.round(((counts.matched + counts.partial * 0.5) / counts.total) * 100)
    return {
      requirement: req,
      percentage: pct,
      matchedCount: counts.matched,
      totalCount: counts.total,
    }
  })

  reqCoverageList.sort((a, b) => b.percentage - a.percentage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Talent Pool Intelligence
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Screening Analytics — {jobTitle}
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Aggregate analytics across {candidates.length} candidates
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dash-card p-5 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
            CANDIDATE POOL
          </span>
          <span className="text-2xl font-black text-slate-900">{candidates.length}</span>
          <span className="text-xs text-slate-500 block mt-1">100% Processed</span>
        </div>

        <div className="dash-card p-5 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 block mb-1">
            STRONG MATCHES
          </span>
          <span className="text-2xl font-black text-emerald-600">{strongCount} ({strongPct}%)</span>
          <span className="text-xs text-slate-500 block mt-1">Ready for Interview</span>
        </div>

        <div className="dash-card p-5 bg-white">
          <span className="text-[10px] font-mono font-bold uppercase text-amber-600 block mb-1">
            MARGINAL MATCHES
          </span>
          <span className="text-2xl font-black text-amber-600">{reviewCount} ({reviewPct}%)</span>
          <span className="text-xs text-slate-500 block mt-1">Require Manual Review</span>
        </div>

        <div className="dash-card p-5 bg-blue-50/40 border-blue-200">
          <span className="text-[10px] font-mono font-bold uppercase text-blue-700 block mb-1">
            SHORTLISTED
          </span>
          <span className="text-2xl font-black text-blue-700">{shortlistedCount}</span>
          <span className="text-xs text-slate-500 block mt-1">Selected by Recruiter</span>
        </div>
      </div>

      {/* Grid: Left Fit Distribution (40%), Right Requirement Coverage (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Fit Distribution */}
        <div className="lg:col-span-5 dash-card p-6 bg-white space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
              Candidate Quality Breakdown
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              Fit Score Distribution
            </h4>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1 text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Strong Match (≥80%)
                </span>
                <span className="font-mono">{strongCount} ({strongPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${strongPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1 text-slate-700">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Needs Review (50–79%)
                </span>
                <span className="font-mono">{reviewCount} ({reviewPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${reviewPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1 text-slate-700">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Low Fit (&lt;50%)
                </span>
                <span className="font-mono">{lowCount} ({lowPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${lowPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Requirement Coverage across Pool */}
        <div className="lg:col-span-7 dash-card p-6 bg-white space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
              Talent Pool Supply Analysis
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              Requirement Coverage Across All Resumes
            </h4>
          </div>

          <div className="space-y-3 pt-2">
            {reqCoverageList.map((item) => (
              <div key={item.requirement} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="truncate max-w-[320px]">{item.requirement}</span>
                  <span className="font-mono font-bold text-blue-600">
                    {item.percentage}% ({item.matchedCount}/{item.totalCount})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.percentage >= 75
                        ? 'bg-blue-600'
                        : item.percentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
