import { motion } from 'framer-motion'
import { GraduationCap, Briefcase, Code2, FolderGit2, Award, Mail, Phone, ExternalLink, CheckCircle2 } from 'lucide-react'
import type { CandidateProfile, ExtractedField, FitScore } from '../types/resume'

interface CandidateProfileProps {
  candidate: CandidateProfile
  fields: ExtractedField[]
  fitScore: FitScore
}

export default function CandidateProfileCard({ candidate, fields, fitScore }: CandidateProfileProps) {
  const fieldMap = Object.fromEntries(fields.map(f => [f.field_id, f]))

  // Calculate percentages for Fit Analysis bar
  const total = fitScore.total || 1
  const matchedPct = Math.round((fitScore.matched / total) * 100)
  const partialPct = Math.round((fitScore.partial / total) * 100)
  const missingPct = Math.round((fitScore.missing / total) * 100)

  return (
    <div className="space-y-6">
      {/* ── Row 1: Education | Experience (2-Column Grid) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Education */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card p-6 flex flex-col justify-between h-full"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <GraduationCap size={14} className="text-blue-600" />
                Education
              </span>
              <span className="text-[10px] font-mono text-slate-400">EDUCATION-DEGREE</span>
            </div>

            {fieldMap['EDUCATION-DEGREE']?.status === 'FOUND' && fieldMap['EDUCATION-DEGREE']?.value ? (
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {fieldMap['EDUCATION-DEGREE'].value}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-400 italic">No degree found in resume</p>
            )}
          </div>
          <div className="text-[10px] font-mono text-emerald-600 mt-4 flex items-center gap-1">
            <CheckCircle2 size={11} /> Grounded in Education section
          </div>
        </motion.div>

        {/* Card 2: Recent Experience */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="dash-card p-6 flex flex-col justify-between h-full"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Briefcase size={14} className="text-blue-600" />
                Recent Experience
              </span>
              <span className="text-[10px] font-mono text-slate-400">EXPERIENCE-ROLE</span>
            </div>

            {fieldMap['EXPERIENCE-ROLE']?.status === 'FOUND' && fieldMap['EXPERIENCE-ROLE']?.value ? (
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {fieldMap['EXPERIENCE-ROLE'].value}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-400 italic">No recent experience found</p>
            )}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-4">
            {fieldMap['EXPERIENCE-ROLE']?.status === 'FOUND' ? 'Extracted from Experience section' : 'Not found in candidate text'}
          </div>
        </motion.div>
      </div>

      {/* ── Row 2: Contact Details | Fit Analysis (2-Column Grid) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 3: Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="dash-card p-6 flex flex-col justify-between h-full"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Mail size={14} className="text-blue-600" />
                Contact Information
              </span>
              <span className="text-[10px] font-mono text-slate-400">CONTACT</span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              {candidate.email ? (
                <div className="flex items-center gap-2 text-slate-700 font-mono truncate">
                  <Mail size={14} className="text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 truncate">
                    {candidate.email}
                  </a>
                </div>
              ) : (
                <div className="text-slate-400 italic">Email: Not found</div>
              )}

              {candidate.phone ? (
                <div className="flex items-center gap-2 text-slate-700 font-mono">
                  <Phone size={14} className="text-slate-400 flex-shrink-0" />
                  <span>{candidate.phone}</span>
                </div>
              ) : (
                <div className="text-slate-400 italic">Phone: Not found</div>
              )}

              {candidate.linkedin_url && (
                <div className="flex items-center gap-2 text-blue-600 font-medium truncate">
                  <ExternalLink size={14} className="text-blue-600 flex-shrink-0" />
                  <a
                    href={candidate.linkedin_url.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline truncate"
                  >
                    {candidate.linkedin_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-4">
            Canonical candidate details
          </div>
        </motion.div>

        {/* Card 4: Fit Analysis Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="dash-card p-6 flex flex-col justify-between h-full"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Fit Analysis Breakdown
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {fitScore.matched + fitScore.partial + fitScore.missing} Total Reqs
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Matched bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Matched
                  </span>
                  <span className="font-mono text-slate-700">{fitScore.matched} ({matchedPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${matchedPct}%` }} />
                </div>
              </div>

              {/* Partial bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Partial
                  </span>
                  <span className="font-mono text-slate-700">{fitScore.partial} ({partialPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${partialPct}%` }} />
                </div>
              </div>

              {/* Missing bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Missing
                  </span>
                  <span className="font-mono text-slate-700">{fitScore.missing} ({missingPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${missingPct}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-3">
            Grounded alignment summary
          </div>
        </motion.div>
      </div>

      {/* ── Row 3: Skills & Technologies Full-Width Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="dash-card p-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
            <Code2 size={15} className="text-blue-600" />
            Skills & Technologies
          </h4>
          <span className="text-[10px] font-mono text-slate-400">SKILLS-LIST</span>
        </div>

        {fieldMap['SKILLS-LIST']?.status === 'FOUND' && fieldMap['SKILLS-LIST']?.value ? (
          <div className="flex flex-wrap gap-2">
            {fieldMap['SKILLS-LIST'].value
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .map(skill => (
                <span
                  key={skill}
                  className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs"
                >
                  {skill}
                </span>
              ))}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-400 italic">No skills extracted from resume</p>
        )}
      </motion.div>

      {/* ── Row 4: Key Projects | Certifications (2-Column Grid) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Key Projects */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="dash-card p-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
              <FolderGit2 size={15} className="text-blue-600" />
              Key Projects
            </h4>
            <span className="text-[10px] font-mono text-slate-400">PROJECT-LIST</span>
          </div>

          {fieldMap['PROJECT-LIST']?.status === 'FOUND' && fieldMap['PROJECT-LIST']?.value ? (
            <div className="space-y-3">
              {fieldMap['PROJECT-LIST'].value.split(' | ').map((proj, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {proj}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400 italic">No projects found in resume</p>
          )}
        </motion.div>

        {/* Right: Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dash-card p-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
              <Award size={15} className="text-blue-600" />
              Certifications
            </h4>
            <span className="text-[10px] font-mono text-slate-400">CERT-LIST</span>
          </div>

          {fieldMap['CERT-LIST']?.status === 'FOUND' && fieldMap['CERT-LIST']?.value ? (
            <div className="space-y-3">
              {fieldMap['CERT-LIST'].value.split(' | ').map((cert, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {cert}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400 italic">No certifications found in resume</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
