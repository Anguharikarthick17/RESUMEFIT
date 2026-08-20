import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Search,
  Code2,
  FileCheck,
  BarChart2,
  ChevronRight,
  Zap,
} from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ProcessingStatus from '../components/ProcessingStatus'
import { analyzeResumeApi } from '../api/resumeFitApi'
import type { AnalysisResponse } from '../types/resume'

interface LandingProps {
  onAnalysisComplete: (data: AnalysisResponse, targetJd: string) => void
  onNavigateToCandidate?: () => void
}

const SAMPLE_JD = `Senior Full Stack Engineer
Responsibilities:
- Build scalable backend microservices using Java and Spring Boot
- Develop responsive web applications using React and TypeScript
- Design and optimize SQL databases and PostgreSQL queries
- Deploy and maintain containerized workloads using Docker and AWS
- Write unit and integration tests with JUnit and Mockito

Requirements:
- Bachelor's or Master's degree in Computer Science or related engineering field
- 3+ years of professional experience with Java and Spring Framework
- Proficiency with React, TypeScript, and modern CSS
- Strong database knowledge including SQL, schema design, and indexing
- Familiarity with cloud platforms (AWS/GCP), CI/CD pipelines, and Git`

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Upload Resume & Define Requirements',
    desc: 'Upload any candidate resume (PDF or DOCX) and specify target job qualifications to evaluate.',
  },
  {
    step: '02',
    title: 'Deterministic Extraction & Evidence Grounding',
    desc: 'Extract 10 canonical fields and verify every skill, role, and degree against verbatim source text.',
  },
  {
    step: '03',
    title: 'Objective Fit Report & Shortlist Ranking',
    desc: 'Inspect MATCHED, PARTIAL, and MISSING requirements with reproducible deterministic scoring.',
  },
]

const PIPELINE_FLOW = [
  { step: '01', name: 'File Ingestion', desc: 'PDF/DOCX layer' },
  { step: '02', name: 'Text Extraction', desc: 'Zero OCR noise' },
  { step: '03', name: 'Section Mapping', desc: 'Allowlist filters' },
  { step: '04', name: 'Schema Parsing', desc: '10 canonical fields' },
  { step: '05', name: 'Evidence Grounding', desc: 'Verbatim quotes' },
  { step: '06', name: 'Requirement Match', desc: 'Weighted scoring' },
  { step: '07', name: 'Deterministic Score', desc: 'Reproducible %' },
]

const WHY_RESUMEFIT_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Zero Hallucinations',
    desc: 'Every extracted claim is tied to verbatim resume text. If not found in text, marked NOT_FOUND.',
  },
  {
    icon: CheckCircle2,
    title: '100% Deterministic',
    desc: 'Same resume + same job description always yields identical fit scores and evidence citations.',
  },
  {
    icon: Layers,
    title: 'Canonical 10-Field Schema',
    desc: 'Structured profile extraction covering education, skills, experience, certifications, and contact info.',
  },
  {
    icon: FileCheck,
    title: 'Human-In-The-Loop',
    desc: 'AI assistive insights that empower talent teams without replacing human hiring judgment.',
  },
]

export default function Landing({ onAnalysisComplete, onNavigateToCandidate }: LandingProps) {
  const [file, setFile] = useState<File | null>(null)
  const [jd, setJd] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState('Initializing...')
  const [progress, setProgress] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile)
    setValidationError(null)
  }

  const handleAnalyze = async () => {
    if (!file) {
      setValidationError('Please upload a resume file (PDF or DOCX) to proceed.')
      return
    }
    if (!jd.trim()) {
      setValidationError('Please provide a target job description to evaluate requirements against.')
      return
    }

    setValidationError(null)
    setIsProcessing(true)
    setProgress(5)
    setCurrentStep('Ingesting resume file...')

    try {
      const result = await analyzeResumeApi(file, jd, (step, pct) => {
        setCurrentStep(step)
        setProgress(pct)
      })

      setIsProcessing(false)
      onAnalysisComplete(result, jd)
    } catch (err: any) {
      setIsProcessing(false)
      setValidationError(err?.message || 'Analysis failed. Please check your backend connection and try again.')
    }
  }

  const scrollToAnalysis = () => {
    document.getElementById('analysis-workspace')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isReady = Boolean(file && jd.trim())

  return (
    <div className="min-h-screen bg-[#F8F8F7] text-[#111111] pb-16">
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5]">
                <Sparkles size={11} className="text-[#111111]" />
                <span>Evidence-Grounded Resume Screening</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111111] tracking-tight leading-tight">
                Know how well your resume fits the job.
              </h1>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed font-normal max-w-3xl">
                Upload a candidate resume and compare it against target job description requirements using <strong>verbatim evidence-grounded matching</strong>.
              </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-3">
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
          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Extracted Fields
              </span>
              <div className="text-2xl font-black text-[#111111]">10</div>
            </div>
            <span className="text-xs text-[#777777] font-sans mt-2 block">Fixed canonical schema</span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Evidence Grounding
              </span>
              <div className="text-2xl font-black text-emerald-700">100%</div>
            </div>
            <span className="text-xs text-[#777777] font-sans mt-2 block">Verbatim text quotes</span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Hallucination Rate
              </span>
              <div className="text-2xl font-black text-[#111111]">0%</div>
            </div>
            <span className="text-xs text-[#777777] font-sans mt-2 block">Strict NOT_FOUND flags</span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Match Scoring
              </span>
              <div className="text-2xl font-black text-[#111111]">Deterministic</div>
            </div>
            <span className="text-xs text-[#777777] font-sans mt-2 block">Same inputs = same score</span>
          </div>
        </div>

        {/* ── Evaluation Workspace Card (Equal 50/50 Columns) ── */}
        <motion.div
          id="analysis-workspace"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="dash-card p-6 sm:p-8 space-y-6 bg-white"
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Evaluation Workspace
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
              Analyze Candidate Resume
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#666666] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  02 / Target Job Description
                </label>
                <span className="text-xs text-[#888888] font-mono">
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
                  className="flex-1 w-full h-full p-4 text-xs sm:text-sm font-sans bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl resize-none outline-none focus:bg-white focus:border-black transition-all text-[#111111] placeholder-[#888888] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setJd(SAMPLE_JD)
                    setValidationError(null)
                  }}
                  className="text-xs font-semibold text-[#111111] hover:text-black underline"
                >
                  Load sample Java/Spring job description
                </button>
                {jd && (
                  <button
                    type="button"
                    onClick={() => setJd('')}
                    className="text-xs text-[#888888] hover:text-[#111111]"
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
          <div className="pt-4 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#777777] font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>POST /api/analyze</span>
              <span className="text-[#CCCCCC]">•</span>
              <span>Deterministic Supabase Engine Online</span>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
              {!isReady && (
                <span className="text-xs text-[#888888] font-medium">
                  {!file ? 'Upload resume' : 'Enter job description'} to enable
                </span>
              )}
              <button
                onClick={handleAnalyze}
                disabled={!isReady}
                className="btn-primary w-full sm:w-auto text-xs sm:text-sm py-2.5 px-6 shadow-sm disabled:opacity-40"
              >
                <span>Analyze Resume →</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Processing Modal Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <ProcessingStatus step={currentStep} progress={progress} />
          </div>
        )}

        {/* ── 3-Step How It Works Section ── */}
        <section id="how-it-works" className="space-y-4 pt-2">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Workflow Overview
            </span>
            <h3 className="text-xl font-bold text-[#111111] mt-1">
              How ResumeFit Works
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.step} className="dash-card p-6 space-y-2 bg-white">
                <span className="text-[10px] font-mono font-bold text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5] px-2 py-0.5 rounded-md">
                  Step {step.step}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-[#111111]">
                  {step.title}
                </h4>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Pipeline Flow Bar */}
          <div className="dash-card p-6 bg-white">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] block mb-3 text-center sm:text-left">
              7-Step Deterministic Pipeline Architecture
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {PIPELINE_FLOW.map((p) => (
                <div key={p.step} className="p-3 bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl text-center">
                  <span className="text-[10px] font-mono font-bold text-[#111111] block">
                    {p.step}
                  </span>
                  <span className="text-xs font-bold text-[#111111] block">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-[#777777] font-mono block truncate">
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
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Core Principles
            </span>
            <h3 className="text-xl font-bold text-[#111111] mt-1">
              Why ResumeFit
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_RESUMEFIT_FEATURES.map((feat) => {
              const Icon = feat.icon
              return (
                <div key={feat.title} className="dash-card p-6 space-y-2 bg-white">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F5F4] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
                    <Icon size={18} />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-[#111111]">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="pt-8 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#777777]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111111]">ResumeFit</span>
            <span>—</span>
            <span>AI Recruiter Intelligence</span>
          </div>
          <span className="font-mono text-[11px] text-[#888888]">
            Deterministic Grounded Candidate Analysis
          </span>
        </footer>

      </div>
    </div>
  )
}
