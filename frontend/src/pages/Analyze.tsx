import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ProcessingStatus from '../components/ProcessingStatus'
import { analyzeResume } from '../api/resumeFitApi'
import type { AnalysisResponse, AnalysisError } from '../types/resume'

interface AnalyzeProps {
  onResults: (data: AnalysisResponse, jd?: string) => void
  onError: (error: AnalysisError) => void
}

const SAMPLE_JD = `Java Software Engineer Intern

Company Overview:
We are a premier software engineering firm building scalable cloud platforms.
Duration: 3 - 6 months
Experience Level: Fresher / Student

Responsibilities:
- Develop and maintain software applications using Java.
- Basic knowledge of Spring Boot.
- Familiarity with Git and GitHub.

Requirements:
- Currently pursuing a Bachelor's degree in Computer Science, Computer Engineering, or a related field.
- Experience building Java or Spring Boot projects.
- Basic knowledge of web development using HTML, CSS, and JavaScript.`

export default function Analyze({ onResults, onError }: AnalyzeProps) {
  const [file, setFile] = useState<File | null>(null)
  const [jd, setJd] = useState('')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState('Preparing analysis...')
  const [progress, setProgress] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleProgress = (s: string, p: number) => {
    setStep(s)
    setProgress(p)
  }

  const runAnalysis = async () => {
    setValidationError(null)
    if (!file) {
      setValidationError('Please upload a candidate resume file (PDF or DOCX).')
      return
    }
    if (!jd.trim()) {
      setValidationError('Please paste a target job description.')
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setProcessing(true)
    setProgress(10)
    setStep('Uploading resume...')

    try {
      const result = await analyzeResume(file, jd, handleProgress, abortController.signal)
      setProgress(100)
      setStep('Analysis complete!')
      await new Promise(r => setTimeout(r, 250))
      onResults(result, jd)
    } catch (err: any) {
      if (err?.code !== 'ABORTED') {
        onError(err as AnalysisError)
      }
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 pt-16 pb-16 bg-slate-50">
        <ProcessingStatus step={step} progress={progress} />
      </div>
    )
  }

  const isReady = Boolean(file && jd.trim())

  return (
    <div className="min-h-screen pt-6 pb-20 bg-slate-50">
      {/* ── Global 1400px Container ── */}
      <div className="app-container space-y-6">
        {/* Header */}
        <div className="dash-card p-6 sm:p-8 bg-white">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 mb-2">
            <Sparkles size={12} className="text-blue-600" />
            Analysis Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Analyze Candidate Resume
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Upload the candidate's resume and define the target job requirements to generate an evidence-backed evaluation report.
          </p>
        </div>

        {/* Main Analysis Card (Equal 50/50 Columns) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card p-6 sm:p-8 space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Upload (50%) */}
            <div className="flex flex-col h-full">
              <UploadZone file={file} onFile={setFile} />
            </div>

            {/* Right: JD (50%) */}
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  02 / Target Job Description
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {jd.length} chars
                </span>
              </div>

              <div className="flex-1 flex flex-col min-h-[280px] sm:min-h-[310px]">
                <textarea
                  value={jd}
                  onChange={(e) => {
                    setJd(e.target.value)
                    setValidationError(null)
                  }}
                  placeholder="Paste the job description requirements you want to evaluate this candidate against..."
                  className="flex-1 w-full h-full p-4 text-xs sm:text-sm font-sans bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-100 transition-all text-slate-800 placeholder-slate-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setJd(SAMPLE_JD)
                    setValidationError(null)
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                >
                  Load sample Java/Spring job description
                </button>
                {jd && (
                  <button
                    type="button"
                    onClick={() => setJd('')}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* CTA Submit Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>POST /api/analyze</span>
              <span className="text-slate-300">•</span>
              <span>Deterministic Engine</span>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
              {!isReady && (
                <span className="text-xs text-slate-400 font-medium">
                  {!file ? 'Upload resume' : 'Enter job description'} to enable analysis
                </span>
              )}
              <button
                onClick={runAnalysis}
                disabled={!isReady}
                className="btn-primary w-full sm:w-auto text-xs sm:text-sm py-2.5 px-6 shadow-sm"
              >
                <span>Analyze Resume</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
