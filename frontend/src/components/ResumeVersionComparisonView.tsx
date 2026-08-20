import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitCompare, ArrowRight, CheckCircle2, XCircle, AlertTriangle, UploadCloud, RefreshCw } from 'lucide-react'
import type { AnalysisResponse } from '../types/resume'
import { analyzeResumeApi } from '../api/resumeFitApi'

interface ResumeVersionComparisonViewProps {
  currentData: AnalysisResponse
  jobDescription: string
}

export default function ResumeVersionComparisonView({
  currentData,
  jobDescription,
}: ResumeVersionComparisonViewProps) {
  const [v2File, setV2File] = useState<File | null>(null)
  const [v2Data, setV2Data] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setV2File(file)
    setLoading(true)
    setError(null)

    try {
      const res = await analyzeResumeApi(file, jobDescription)
      setV2Data(res)
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze Version 2 resume.')
    } finally {
      setLoading(false)
    }
  }

  const v1Score = currentData.fit_score.fit_score
  const v2Score = v2Data ? v2Data.fit_score.fit_score : v1Score
  const delta = v2Score - v1Score

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Evolution & Delta Analysis
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            Compare Resume Versions
          </h3>
        </div>

        <div className="text-xs text-[#777777] font-mono">
          Compare version impact against the exact same Job Description
        </div>
      </div>

      {/* Version Comparison Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dash-card p-5 bg-white text-center">
          <span className="text-[10px] font-mono font-bold uppercase text-[#777777] block mb-1">
            VERSION 1 (CURRENT)
          </span>
          <span className="text-3xl font-black text-[#111111]">{v1Score}%</span>
          <span className="text-xs text-[#777777] block mt-1">
            {currentData.fit_score.matched} Matched / {currentData.fit_score.missing} Missing
          </span>
        </div>

        <div className="dash-card p-5 bg-white text-center">
          <span className="text-[10px] font-mono font-bold uppercase text-[#111111] block mb-1">
            VERSION 2 (UPDATED)
          </span>
          <span className="text-3xl font-black text-[#111111]">
            {v2Data ? `${v2Score}%` : 'Upload below'}
          </span>
          <span className="text-xs text-[#777777] block mt-1">
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
        <div className="dash-card p-6 bg-white space-y-4 text-center border border-[#E5E5E5]">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F5F5F4] border border-[#E5E5E5] mx-auto flex items-center justify-center text-[#111111]">
              <UploadCloud size={24} />
            </div>

            <h4 className="text-base font-bold text-[#111111]">
              Upload Updated Resume (Version 2)
            </h4>
            <p className="text-xs text-[#666666]">
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

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
          </div>
        </div>
      ) : (
        /* Side by Side Diff */
        <div className="dash-card p-6 bg-white space-y-4 border border-[#E5E5E5]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <h4 className="text-sm font-bold text-[#111111]">
              Requirement-by-Requirement Delta
            </h4>
            <span className="text-xs font-mono text-[#777777]">
              v2: {v2File?.name}
            </span>
          </div>

          <div className="space-y-2">
            {currentData.requirements.map((r, idx) => {
              const v2Match = v2Data.requirements.find((vr) => vr.requirement === r.requirement)
              const v1Status = r.match_status
              const v2Status = v2Match ? v2Match.match_status : 'UNKNOWN'
              const improved = v1Status !== 'MATCHED' && v2Status === 'MATCHED'

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    improved
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-[#F8F8F7] border-[#E5E5E5]'
                  }`}
                >
                  <span className="font-semibold text-[#111111] truncate max-w-md">
                    {r.requirement}
                  </span>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-[#777777]">{v1Status}</span>
                    <ArrowRight size={12} className="text-[#AAAAAA]" />
                    <span className={`font-bold ${v2Status === 'MATCHED' ? 'text-emerald-800' : 'text-[#111111]'}`}>
                      {v2Status}
                    </span>
                    {improved && (
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                        +IMPROVED
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
