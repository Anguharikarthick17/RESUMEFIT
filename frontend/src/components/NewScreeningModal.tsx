import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Sparkles,
  ArrowRight,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
} from 'lucide-react'
import type { JobOpening, RankedCandidate } from '../types/recruiter'
import { runScreeningSession } from '../api/resumeFitApi'
import { SAMPLE_CANDIDATES } from '../utils/demoDataGenerator'
import { getStoredJobOpenings } from '../utils/recruiterStore'

interface NewScreeningModalProps {
  onClose: () => void
  onCompleteScreening: (job: JobOpening, candidates: RankedCandidate[]) => void
}

export default function NewScreeningModal({ onClose, onCompleteScreening }: NewScreeningModalProps) {
  const existingJobs = getStoredJobOpenings()

  const [selectedJobId, setSelectedJobId] = useState<string>(existingJobs[0]?.id || 'custom')
  const [jobTitle, setJobTitle] = useState(existingJobs[0]?.title || 'AI / Machine Learning Engineer')
  const [department, setDepartment] = useState(existingJobs[0]?.department || 'Engineering & Data')
  const [location, setLocation] = useState(existingJobs[0]?.location || 'San Francisco, CA (Hybrid)')
  const [experienceLevel, setExperienceLevel] = useState(existingJobs[0]?.experience_level || 'Mid-Senior (2+ years)')
  const [jobDescription, setJobDescription] = useState(existingJobs[0]?.job_description || '')

  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState('Preparing screening session...')
  const [progressPct, setProgressPct] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSelectExistingJob = (jobId: string) => {
    setSelectedJobId(jobId)
    const found = existingJobs.find((j) => j.id === jobId)
    if (found) {
      setJobTitle(found.title)
      setDepartment(found.department)
      setLocation(found.location)
      setExperienceLevel(found.experience_level)
      setJobDescription(found.job_description)
    }
  }

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...added])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Load sample demo batch for instant hackathon showcase
  const handleLoadSampleBatch = async () => {
    setErrorMsg(null)
    const demoFiles: File[] = []

    for (const cand of SAMPLE_CANDIDATES) {
      const textContent = `
${cand.name}
${cand.email} | ${cand.phone}

Education
${cand.degree}

Experience
${cand.role}

Skills
${cand.skills}

Projects
${cand.projects}

Certifications
${cand.certs}
      `.trim()

      const blob = new Blob([textContent], { type: 'text/plain' })
      const demoFile = new File([blob], `${cand.name.toLowerCase().replace(/\s+/g, '_')}_resume.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      demoFiles.push(demoFile)
    }

    setFiles(demoFiles)
  }

  const handleStartScreening = async () => {
    setErrorMsg(null)
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setErrorMsg('Please specify a Job Title and Job Description.')
      return
    }
    if (files.length === 0) {
      setErrorMsg('Please upload at least 1 candidate resume.')
      return
    }

    setIsProcessing(true)
    setProgressMsg('Uploading resumes to Supabase Storage...')
    setProgressPct(20)

    try {
      const { job, candidates } = await runScreeningSession(
        files,
        jobTitle,
        jobDescription,
        department,
        location,
        (msg, pct) => {
          setProgressMsg(msg)
          setProgressPct(pct)
        },
      )

      await new Promise((r) => setTimeout(r, 300))
      onCompleteScreening(job, candidates)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Batch screening failed.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
              Recruiter Screening Setup
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              New Candidate Screening Session
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Processing State */}
        {isProcessing ? (
          <div className="py-12 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-600 animate-pulse">
              <Sparkles size={28} />
            </div>

            <div>
              <span className="text-xs font-mono font-bold uppercase text-blue-600">
                AI Screening in Progress
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">
                Analyzing {files.length} Candidate Resumes
              </h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {progressMsg}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Deterministic Supabase pipeline</span>
                <span>{progressPct}%</span>
              </div>
            </div>
          </div>
        ) : (
          /* Form Content */
          <div className="space-y-6">
            {/* Step 1: Select / Customize Job Opening */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-mono text-slate-700 uppercase">
                  1. Select Job Opening
                </label>
                <div className="flex items-center gap-1.5">
                  {existingJobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => handleSelectExistingJob(j.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                        selectedJobId === j.id
                          ? 'bg-blue-50 border-blue-500 text-blue-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {j.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">
                    JOB TITLE
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">
                    EXPERIENCE LEVEL
                  </label>
                  <input
                    type="text"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">
                  JOB DESCRIPTION REQUIREMENTS
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Step 2: Upload Multiple Resumes */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-mono text-slate-700 uppercase">
                  2. Upload Candidate Resumes (PDF / DOCX)
                </label>

                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg"
                >
                  ⚡ Load Sample 6 Candidates
                </button>
              </div>

              {/* Multi-file Dropzone */}
              <label className="dash-card p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-2 block">
                <UploadCloud size={28} className="text-slate-400" />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Click to select multiple resume files, or drag and drop
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Supports PDF & DOCX • Batch size: 1–500 resumes
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  className="sr-only"
                  onChange={handleFilesAdded}
                />
              </label>

              {/* Uploaded Queue List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Selected Queue: {files.length} resumes</span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-rose-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-blue-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Supabase Storage & Database Integration
              </span>

              <button
                onClick={handleStartScreening}
                disabled={files.length === 0 || !jobTitle.trim()}
                className="btn-primary py-2.5 px-6 text-xs sm:text-sm font-bold shadow-sm disabled:opacity-40"
              >
                <span>Start Screening ({files.length} Resumes)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
