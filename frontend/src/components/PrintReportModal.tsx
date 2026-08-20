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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 shadow-2xl border border-[#E5E5E5]">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#111111] bg-[#F5F5F4] px-2.5 py-1 rounded border border-[#E5E5E5]">
              Report ID: {analysisId}
            </span>
            <span className="text-xs text-[#777777] font-sans">Print Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary text-xs py-2 px-4 shadow-sm font-bold"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#777777] hover:text-[#111111] rounded-lg hover:bg-[#F5F5F4]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── PRINT CONTENT ── */}
        <div className="space-y-6 text-[#111111]">
          {/* Top Header */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-black text-white font-black text-xs flex items-center justify-center border border-neutral-800">
                  RF
                </span>
                <span className="text-xl font-black tracking-tight">ResumeFit</span>
              </div>
              <p className="text-[10px] font-mono text-[#777777] uppercase tracking-wider mt-0.5">
                Evidence-Grounded Candidate & Career Intelligence
              </p>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="font-bold text-[#111111]">ID: {analysisId}</span>
              <p className="text-[#888888]">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Section 1: Candidate Overview & Summary Scores */}
          <div className="p-4 bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#777777] uppercase">CANDIDATE</span>
                <h3 className="text-xl font-black text-[#111111]">{candidate.full_name ?? 'Candidate'}</h3>
                <p className="text-xs text-[#666666]">{candidate.email} • {candidate.phone ?? 'No phone'}</p>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div>
                  <span className="text-[10px] font-mono text-[#777777] block font-bold">RAW FIT</span>
                  <span className="text-xl font-black text-[#111111]">{data.fit_score.fit_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#111111] block font-bold">WEIGHTED FIT</span>
                  <span className="text-xl font-black text-[#111111]">{weighted.weighted_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-800 block font-bold">READINESS</span>
                  <span className="text-xl font-black text-emerald-700">{readiness.overall}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Grounded Facts (Extracted Evidence) */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E5] pb-1">
              Part I — Verified Candidate Facts & Grounded Fields
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg">
                <span className="text-[10px] font-mono text-[#777777] font-bold block">EDUCATION</span>
                <p className="font-bold text-[#111111] mt-0.5">
                  {fields.find((f) => f.field_id === 'EDUCATION-DEGREE')?.value ?? 'Not found'}
                </p>
              </div>

              <div className="p-3 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg">
                <span className="text-[10px] font-mono text-[#777777] font-bold block">EXPERIENCE</span>
                <p className="font-bold text-[#111111] mt-0.5">
                  {fields.find((f) => f.field_id === 'EXPERIENCE-ROLE')?.value ?? 'Not found'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs">
              <span className="text-[10px] font-mono text-[#777777] font-bold block mb-1">TECHNICAL SKILLS</span>
              <p className="text-[#333333] font-medium leading-relaxed">
                {fields.find((f) => f.field_id === 'SKILLS-LIST')?.value ?? 'No skills extracted'}
              </p>
            </div>
          </div>

          {/* Section 3: Requirement Alignment Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E5] pb-1">
              Part II — Requirement Alignment Breakdown
            </h4>

            <div className="space-y-1.5 text-xs">
              {requirements.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-[#F8F8F7] rounded border border-[#E5E5E5]">
                  <span className="font-medium text-[#111111]">{r.requirement}</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.match_status === 'MATCHED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : r.match_status === 'PARTIAL'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
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
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E5] pb-1">
              Part III — Recruiter Recommendation (Non-Binding)
            </h4>

            <div className="p-4 bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl space-y-2 text-xs">
              <div className="font-bold text-[#111111]">
                Decision: <span className="text-black font-black underline">{recommendation.decision}</span> ({recommendation.headline})
              </div>
              <ul className="space-y-1 text-[#555555] list-disc list-inside">
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
