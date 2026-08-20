import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Layers,
  RefreshCw,
  Globe,
} from 'lucide-react'
import type { CandidateAccount } from '../types/candidate'
import { uploadCandidateMasterResume } from '../api/resumeFitApi'

interface CandidateProfileViewProps {
  candidate: CandidateAccount | null
  onUpdateCandidate: (cand: CandidateAccount) => void
  onNavigateToJobs: () => void
}

export default function CandidateProfileView({
  candidate,
  onUpdateCandidate,
  onNavigateToJobs,
}: CandidateProfileViewProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setErrorMsg(null)
    setSuccessNotice(null)
    setIsUploading(true)

    try {
      const res = await uploadCandidateMasterResume(file, (msg) => setProgressMsg(msg))
      const c = res.candidate
      const updated: CandidateAccount = {
        id: c.id,
        name: c.name || 'Candidate',
        email: c.email,
        phone: c.phone,
        location: c.location,
        linkedin_url: c.linkedin_url,
        summary: c.summary,
        education: c.education || [],
        experience: c.experience || [],
        skills: c.skills || [],
        certifications: c.certifications || [],
        projects: c.projects || [],
        resume_id: res.resume_id,
        resume_filename: file.name,
        resume_fields: res.fields,
      }
      onUpdateCandidate(updated)
      setSuccessNotice(
        res.is_duplicate
          ? 'Resume verified & matched via SHA-256 deduplication.'
          : 'Resume parsed & stored in Supabase successfully!',
      )
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse resume.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero / Header */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
            Candidate Career Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            My Profile & Master Resume
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
            Upload your resume to calculate your fit across active jobs and apply with 1-click.
          </p>
        </div>

        {candidate && (
          <button
            onClick={onNavigateToJobs}
            className="btn-primary text-xs sm:text-sm py-2.5 px-5 shadow-sm self-start md:self-auto"
          >
            <Sparkles size={15} />
            <span>Discover Matching Jobs →</span>
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      <div className="dash-card p-6 sm:p-8 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <span>Upload or Update Master Resume</span>
          </h3>
          {candidate?.resume_filename && (
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-bold">
              Active: {candidate.resume_filename}
            </span>
          )}
        </div>

        <label className="dash-card p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/20 cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 block">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            {isUploading ? <RefreshCw size={24} className="animate-spin" /> : <UploadCloud size={24} />}
          </div>

          <div>
            <span className="text-sm font-bold text-slate-800">
              {isUploading ? progressMsg : 'Click to select your PDF or DOCX resume, or drag and drop'}
            </span>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Supports PDF & DOCX • Deterministic field & evidence extraction • SHA-256 deduplicated
            </p>
          </div>

          <input
            type="file"
            accept=".pdf,.docx,.doc"
            className="sr-only"
            disabled={isUploading}
            onChange={handleFileUpload}
          />
        </label>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{successNotice}</span>
          </div>
        )}
      </div>

      {/* Extracted Candidate Profile View */}
      {candidate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal Info */}
          <div className="dash-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{candidate.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{candidate.summary || 'Applicant'}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              {candidate.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  <span>{candidate.email}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{candidate.location}</span>
                </div>
              )}
              {candidate.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-blue-500" />
                  <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                    {candidate.linkedin_url}
                  </a>
                </div>
              )}
            </div>

            {/* Skills Pills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                  Extracted Skills ({candidate.skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Experience, Education, Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience */}
            <div className="dash-card p-6 bg-white space-y-3">
              <h4 className="text-xs font-bold font-mono text-slate-700 uppercase flex items-center gap-2">
                <Briefcase size={14} className="text-blue-600" />
                <span>Experience History</span>
              </h4>
              {candidate.experience && candidate.experience.length > 0 ? (
                <div className="space-y-2">
                  {candidate.experience.map((exp, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-900">{exp.role || 'Role'}</span>
                      {exp.evidence && <p className="text-slate-600 font-sans mt-1">{exp.evidence}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No structured roles extracted.</p>
              )}
            </div>

            {/* Education */}
            <div className="dash-card p-6 bg-white space-y-3">
              <h4 className="text-xs font-bold font-mono text-slate-700 uppercase flex items-center gap-2">
                <GraduationCap size={14} className="text-blue-600" />
                <span>Education Background</span>
              </h4>
              {candidate.education && candidate.education.length > 0 ? (
                <div className="space-y-2">
                  {candidate.education.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-900">{edu.degree || 'Degree'}</span>
                      {edu.evidence && <p className="text-slate-600 font-sans mt-1">{edu.evidence}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No education degree detected.</p>
              )}
            </div>

            {/* Projects & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="dash-card p-4 bg-white space-y-2">
                <h4 className="text-xs font-bold font-mono text-slate-700 uppercase flex items-center gap-2">
                  <Code size={13} className="text-blue-600" />
                  <span>Projects</span>
                </h4>
                {candidate.projects && candidate.projects.length > 0 ? (
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {candidate.projects.map((p, idx) => (
                      <li key={idx} className="font-medium">{p.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">None listed</p>
                )}
              </div>

              <div className="dash-card p-4 bg-white space-y-2">
                <h4 className="text-xs font-bold font-mono text-slate-700 uppercase flex items-center gap-2">
                  <Award size={13} className="text-blue-600" />
                  <span>Certifications</span>
                </h4>
                {candidate.certifications && candidate.certifications.length > 0 ? (
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {candidate.certifications.map((c, idx) => (
                      <li key={idx} className="font-medium">{c.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">None listed</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
