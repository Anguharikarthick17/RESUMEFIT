import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, PlusCircle, CheckCircle2, XCircle, ArrowRight, UploadCloud, RefreshCw } from 'lucide-react'
import type { AnalysisResponse } from '../types/resume'
import { analyzeResume } from '../api/resumeFitApi'

interface ResumeVersionComparisonViewProps {
  currentData: AnalysisResponse
  targetJobDescription: string
  onApplyNewVersion?: (newData: AnalysisResponse) => void
}

export default function ResumeVersionComparisonView({
  currentData,
  targetJobDescription,
  onApplyNewVersion,
}: ResumeVersionComparisonViewProps) {
  const [v2File, setV2File] = useState<File | null>(null)
  const [v2Data, setV2Data] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setV2File(file)
    setError(null)
    setLoading(true)

    try {
      const res = await analyzeResume(file, targetJobDescription)
      setV2Data(res)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to analyze Resume v2')
    } finally {
      setLoading(false)
    }
  }

  const v1Score = currentData.fit_score.fit_score
  const v2Score = v2Data?.fit_score.fit_score ?? v1Score
  const delta = v2Score - v1Score

  // Skills comparison
  const v1Skills = new Set(
    (currentData.fields.find((f) => f.field_id === 'SKILLS-LIST')?.value || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )

  const v2Skills = new Set(
    (v2Data?.fields.find((f) => f.field_id === 'SKILLS-LIST')?.value || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )

  const addedSkills = Array.from(v2Skills).filter((s) => !v1Skills.has(s))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Evolution & Delta Analysis
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Compare Resume Versions
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Compare version impact against the exact same Job Description
        </div>
      </div>

      {/* Version Comparison Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dash-card p-5 bg-white text-center">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
            VERSION 1 (CURRENT)
          </span>
          <span className="text-3xl font-black text-slate-900">{v1Score}%</span>
          <span className="text-xs text-slate-500 block mt-1">
            {currentData.fit_score.matched} Matched / {currentData.fit_score.missing} Missing
          </span>
        </div>

        <div className="dash-card p-5 bg-white text-center">
          <span className="text-[10px] font-mono font-bold uppercase text-blue-600 block mb-1">
            VERSION 2 (UPDATED)
          </span>
          <span className="text-3xl font-black text-blue-600">
            {v2Data ? `${v2Score}%` : 'Upload below'}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            {v2Data ? `${v2Data.fit_score.matched} Matched / ${v2Data.fit_score.missing} Missing` : 'Pending v2 upload'}
          </span>
        </div>

        <div className="dash-card p-5 bg-emerald-50/60 border-emerald-200 text-center flex flex-col justify-center">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block mb-1">
            FIT EVOLUTION DELTA
          </span>
          <span className="text-3xl font-black font-mono text-emerald-700">
            {delta >= 0 ? `+${delta}` : delta} Pts
          </span>
          <span className="text-xs text-emerald-800 font-semibold block mt-1">
            {delta > 0 ? 'Verified Score Growth' : 'Zero Net Change'}
          </span>
        </div>
      </div>

      {/* Upload Zone for Resume v2 */}
      {!v2Data ? (
        <div className="dash-card p-6 bg-white space-y-4 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-600">
              <UploadCloud size={24} />
            </div>

            <h4 className="text-base font-bold text-slate-900">
              Upload Updated Resume (Version 2)
            </h4>
            <p className="text-xs text-slate-500">
              Upload your revised PDF or DOCX resume to measure exact grounded improvement against the current JD.
            </p>

            <label className="btn-primary text-xs py-2.5 px-6 cursor-pointer inline-flex">
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                className="sr-only"
                onChange={handleFileChange}
              />
              <span>{loading ? 'Analyzing Version 2...' : 'Select Resume v2 File'}</span>
            </label>

            {error && (
              <p className="text-xs text-rose-600 font-semibold mt-2">{error}</p>
            )}
          </div>
        </div>
      ) : (
        /* Delta Breakdown View */
        <div className="dash-card p-6 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold font-mono text-slate-900">
                Version 2 File: {v2File?.name}
              </span>
            </div>

            {onApplyNewVersion && (
              <button
                onClick={() => onApplyNewVersion(v2Data)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                <span>Set v2 as Active Report</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Added Skills */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
              <span className="text-xs font-bold font-mono text-emerald-800 uppercase flex items-center gap-1">
                <CheckCircle2 size={13} /> Added Skills ({addedSkills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {addedSkills.length > 0 ? (
                  addedSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300">
                      {s.toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No new skill tokens</span>
                )}
              </div>
            </div>

            {/* Improved Evidence */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
              <span className="text-xs font-bold font-mono text-blue-800 uppercase flex items-center gap-1">
                <TrendingUp size={13} /> Evidence Strengthening
              </span>
              <p className="text-xs text-slate-700 font-medium">
                {v2Data.fit_score.matched > currentData.fit_score.matched
                  ? `Converted ${v2Data.fit_score.matched - currentData.fit_score.matched} previously missing requirements into verified matches.`
                  : 'Evidence remains comparable across versions.'}
              </p>
            </div>

            {/* Remaining Gaps */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
              <span className="text-xs font-bold font-mono text-rose-800 uppercase flex items-center gap-1">
                <XCircle size={13} /> Remaining Gaps ({v2Data.fit_score.missing})
              </span>
              <p className="text-xs text-slate-700 font-medium">
                {v2Data.fit_score.missing} requirements still have zero extracted evidence.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
