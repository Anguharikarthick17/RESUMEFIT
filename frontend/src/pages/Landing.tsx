import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ShieldCheck, CheckSquare, Layers, Cpu, ArrowRight } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import type { AnalysisResponse, AnalysisError } from '../types/resume'
import { analyzeResume } from '../api/resumeFitApi'

interface LandingProps {
  onResults: (data: AnalysisResponse, jd?: string) => void
  onError: (error: AnalysisError) => void
  onStartProcessing: (step: string, progress: number) => void
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

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Upload Candidate Resume',
    desc: 'Upload a PDF or DOCX resume. ResumeFit extracts the raw text layer deterministically without modifying the source.',
  },
  {
    step: '02',
    title: 'Input Target Role Requirements',
    desc: 'Paste the target job description. The parser identifies candidate requirements while filtering out noise and metadata.',
  },
  {
    step: '03',
    title: 'Verify Grounded Evidence',
    desc: 'Review the transparent fit score, requirement matches, and inspect the exact resume quotes grounding every result.',
  },
]

const WHY_RESUMEFIT_FEATURES = [
  {
    title: 'Evidence-Backed',
    desc: 'Every extracted claim is strictly linked to verbatim source text from the original resume. Zero hallucinations.',
    icon: ShieldCheck,
  },
  {
    title: 'Deterministic Scoring',
    desc: 'The same resume and job description always produce the exact same requirement match score on repeated runs.',
    icon: Cpu,
  },
  {
    title: 'Transparent Matching',
    desc: 'Clear breakdown of Matched, Partial, and Missing requirements with field references and confidence indicators.',
    icon: CheckSquare,
  },
  {
    title: 'Graceful Failure',
    desc: 'Missing or unparseable fields are explicitly flagged as NOT_FOUND instead of guessing or fabricating candidate data.',
    icon: Layers,
  },
]

const PIPELINE_FLOW = [
  { step: '01', name: 'Resume', desc: 'PDF/DOCX Ingestion' },
  { step: '02', name: 'Extract', desc: 'Text Layer' },
  { step: '03', name: 'Segment', desc: 'Allowlist Sections' },
  { step: '04', name: 'Parse', desc: '10 Fixed Fields' },
  { step: '05', name: 'Evidence', desc: 'Text Grounding' },
  { step: '06', name: 'Match', desc: 'JD Requirements' },
  { step: '07', name: 'Fit Score', desc: 'Deterministic Report' },
]

export default function Landing({ onResults, onError, onStartProcessing }: LandingProps) {
  const [file, setFile] = useState<File | null>(null)
  const [jd, setJd] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleFileChange = (newFile: File) => {
    setFile(newFile)
    setValidationError(null)
  }

  const handleAnalyze = async () => {
    setValidationError(null)
    if (!file) {
      setValidationError('Please upload a candidate resume (PDF or DOCX).')
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

    onStartProcessing('Preparing analysis session...', 5)

    try {
      const result = await analyzeResume(
        file,
        jd,
        (step, progress) => onStartProcessing(step, progress),
        abortController.signal,
      )
      onResults(result, jd)
    } catch (err: any) {
      if (err?.code !== 'ABORTED') {
        onError(err as AnalysisError)
      }
    }
  }

  const scrollToAnalysis = () => {
    document.getElementById('analysis-workspace')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isReady = Boolean(file && jd.trim())

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* ── Global 1400px Container ── */}
      <div className="app-container pt-6 space-y-6">

        {/* ── Welcome Banner / Header Card (Full Width Horizontal Grid) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card p-6 sm:p-8 bg-white"
        >
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200">
                <Sparkles size={12} className="text-blue-600" />
                Welcome to ResumeFit
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Know how well your resume fits the job.
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-3xl">
                Upload a candidate resume and compare it against target job description requirements using <strong>evidence-grounded matching</strong>.
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={scrollToAnalysis}
                className="btn-primary text-xs sm:text-sm py-3 px-6 shadow-sm"
              >
                <span>Analyze Resume</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── 4 Equal Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dash-card p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Extracted Fields
              </span>
              <div className="text-2xl font-black text-slate-900">10</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">Fixed canonical schema</span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Evidence Grounding
              </span>
              <div className="text-2xl font-black text-emerald-600">100%</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">Verbatim text quotes</span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hallucination Rate
              </span>
              <div className="text-2xl font-black text-blue-600">0%</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">Strict NOT_FOUND flags</span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Match Scoring
              </span>
              <div className="text-2xl font-black text-slate-900">Deterministic</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">Same inputs = same score</span>
          </div>
        </div>

        {/* ── Evaluation Workspace Card (Equal 50/50 Columns) ── */}
        <motion.div
          id="analysis-workspace"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="dash-card p-6 sm:p-8 space-y-6"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
              Evaluation Workspace
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Analyze Candidate Resume
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload the candidate's resume and paste the target job description to generate an evidence-backed recruiter report.
            </p>
          </div>

          {/* Equal 50/50 Two-Column Grid */}
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Resume Upload (50%) */}
            <div className="flex flex-col h-full">
              <UploadZone file={file} onFile={handleFileChange} />
            </div>

            {/* Right: Job Description (50%) */}
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
                  placeholder="Paste the target job description requirements here..."
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
              <span className="font-bold">Notice:</span> {validationError}
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>POST /api/analyze</span>
              <span className="text-slate-300">•</span>
              <span>Engine Online</span>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
              {!isReady && (
                <span className="text-xs text-slate-400 font-medium">
                  {!file ? 'Upload resume' : 'Enter job description'} to enable
                </span>
              )}
              <button
                onClick={handleAnalyze}
                disabled={!isReady}
                className="btn-primary w-full sm:w-auto text-xs sm:text-sm py-2.5 px-6 shadow-sm"
              >
                <span>Analyze Resume →</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── 3-Step How It Works Section ── */}
        <section id="how-it-works" className="space-y-4 pt-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
              Workflow Overview
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              How ResumeFit Works
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.step} className="dash-card p-6 space-y-2">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Step {step.step}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {step.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Pipeline Flow Bar */}
          <div className="dash-card p-6">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center sm:text-left">
              7-Step Deterministic Pipeline Architecture
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {PIPELINE_FLOW.map((p) => (
                <div key={p.step} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <span className="text-[10px] font-mono font-bold text-blue-600 block">
                    {p.step}
                  </span>
                  <span className="text-xs font-bold text-slate-900 block">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    {p.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why ResumeFit (4 Feature Cards) ── */}
        <section id="why-resumefit" className="space-y-4 pt-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
              Core Principles
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              Why ResumeFit
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_RESUMEFIT_FEATURES.map((feat) => {
              const Icon = feat.icon
              return (
                <div key={feat.title} className="dash-card p-6 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Icon size={18} />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">ResumeFit</span>
            <span>—</span>
            <span>AI Resume Intelligence</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Deterministic Grounded Candidate Analysis
          </span>
        </footer>

      </div>
    </div>
  )
}
