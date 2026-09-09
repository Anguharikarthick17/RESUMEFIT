import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Briefcase, PlusCircle, AlertCircle, CheckCircle2, Building, MapPin, Sparkles } from 'lucide-react'
import { createJobOpeningInSupabase } from '../api/supabaseService'
import type { JobOpening } from '../types/recruiter'

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  onJobCreated: (newJob: JobOpening) => void
}

export default function CreateJobModal({ isOpen, onClose, onJobCreated }: CreateJobModalProps) {
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('Engineering')
  const [location, setLocation] = useState('San Francisco, CA')
  const [workMode, setWorkMode] = useState('Hybrid')
  const [experienceLevel, setExperienceLevel] = useState('Mid–Senior')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!title.trim()) {
      setErrorMsg('Please enter a job title.')
      return
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a job description.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createJobOpeningInSupabase({
        title,
        department,
        location,
        work_mode: workMode,
        experience_level: experienceLevel,
        description,
        requirements: requirements || 'General experience and qualifications',
      })

      // Reset form
      setTitle('')
      setDescription('')
      setRequirements('')
      onJobCreated(created)
      onClose()
    } catch (err: any) {
      console.error('[CreateJobModal] Error:', err)
      setErrorMsg(err?.message || 'Failed to save job opening to Supabase. Check database connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E5E5E5]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5] px-2.5 py-0.5 rounded">
                Supabase Persistence
              </span>
              <h3 className="text-xl font-black text-[#111111] mt-1">
                Create New Job Opening
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-[#777777] hover:text-[#111111] rounded-lg hover:bg-[#F5F5F4] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold block">Save Error</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-[#777777] font-bold block mb-1">
                JOB TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
                className="w-full p-2.5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs font-bold text-[#111111] outline-none focus:bg-white focus:border-black transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#777777] font-bold block mb-1">
                  DEPARTMENT
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Core Product, Engineering"
                  className="w-full p-2.5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#111111] outline-none focus:bg-white focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#777777] font-bold block mb-1">
                  LOCATION
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA / Remote"
                  className="w-full p-2.5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#111111] outline-none focus:bg-white focus:border-black transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#777777] font-bold block mb-1">
                  WORK MODE
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#111111] outline-none focus:bg-white focus:border-black transition-colors"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#777777] font-bold block mb-1">
                  EXPERIENCE LEVEL
                </label>
                <input
                  type="text"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  placeholder="e.g. Mid–Senior, 3+ years"
                  className="w-full p-2.5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#111111] outline-none focus:bg-white focus:border-black transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#777777] font-bold block mb-1">
                JOB DESCRIPTION *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe responsibilities and overview of the role..."
                required
                className="w-full p-3 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs text-[#111111] outline-none focus:bg-white focus:border-black leading-relaxed font-sans transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#777777] font-bold block mb-1">
                KEY REQUIREMENTS (Comma or newline separated)
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={2}
                placeholder="e.g. Python, SQL, Docker, AWS, 3+ years experience"
                className="w-full p-3 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs text-[#111111] outline-none focus:bg-white focus:border-black leading-relaxed font-sans transition-colors"
              />
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    <span>Save Job to Supabase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
