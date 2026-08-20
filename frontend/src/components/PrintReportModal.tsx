import { Printer, X, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { AnalysisResponse } from '../types/resume'
import type { JobReadinessScore, ShortlistRecommendation, WeightedFitScore } from '../types/intelligence'

interface PrintReportModalProps {
  data: AnalysisResponse
  weighted: WeightedFitScore
  readiness: JobReadinessScore
  recommendation: ShortlistRecommendation
  analysisId: string
  onClose: () => void
}

export default function PrintReportModal({
  data,
  weighted,
  readiness,
  recommendation,
  analysisId,
  onClose,
}: PrintReportModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const { candidate, fields, requirements } = data

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 shadow-2xl">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
              Report ID: {analysisId}
            </span>
            <span className="text-xs text-slate-500 font-sans">Print Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── PRINT CONTENT ── */}
        <div className="space-y-6 text-slate-900">
          {/* Top Header */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  RF
                </span>
                <span className="text-xl font-black tracking-tight">ResumeFit</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">
                Evidence-Grounded Candidate & Career Intelligence
              </p>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="font-bold text-slate-900">ID: {analysisId}</span>
              <p className="text-slate-400">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Section 1: Candidate Overview & Summary Scores */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">CANDIDATE</span>
                <h3 className="text-xl font-black text-slate-900">{candidate.full_name ?? 'Candidate'}</h3>
                <p className="text-xs text-slate-600">{candidate.email} • {candidate.phone ?? 'No phone'}</p>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">RAW FIT</span>
                  <span className="text-xl font-black text-slate-900">{data.fit_score.fit_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-blue-600 block font-bold">WEIGHTED FIT</span>
                  <span className="text-xl font-black text-blue-600">{weighted.weighted_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-600 block font-bold">READINESS</span>
                  <span className="text-xl font-black text-emerald-600">{readiness.overall}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Grounded Facts (Extracted Evidence) */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              Part I — Verified Candidate Facts & Grounded Fields
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">EDUCATION</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {fields.find((f) => f.field_id === 'EDUCATION-DEGREE')?.value ?? 'Not found'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">EXPERIENCE</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {fields.find((f) => f.field_id === 'EXPERIENCE-ROLE')?.value ?? 'Not found'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-[10px] font-mono text-slate-400 font-bold block mb-1">TECHNICAL SKILLS</span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {fields.find((f) => f.field_id === 'SKILLS-LIST')?.value ?? 'No skills extracted'}
              </p>
            </div>
          </div>

          {/* Section 3: Requirement Alignment Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              Part II — Requirement Alignment Breakdown
            </h4>

            <div className="space-y-1.5 text-xs">
              {requirements.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200/70">
                  <span className="font-medium text-slate-800">{r.requirement}</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.match_status === 'MATCHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.match_status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {r.match_status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Recommendations & Shortlist Assessment */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              Part III — Recruiter Recommendation (Non-Binding)
            </h4>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900">
                Decision: <span className="text-blue-600">{recommendation.decision}</span> ({recommendation.headline})
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                {recommendation.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
