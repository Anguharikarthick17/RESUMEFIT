import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

interface UploadZoneProps {
  onFile: (file: File) => void
  file: File | null
}

const ACCEPTED = ['.pdf', '.docx', '.doc']

export default function UploadZone({ onFile, file }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      setError('Unsupported format. Please upload a PDF or DOCX file.')
      return false
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB limit.')
      return false
    }
    setError(null)
    return true
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && validate(dropped)) onFile(dropped)
  }, [onFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked && validate(picked)) onFile(picked)
  }, [onFile])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#666666] font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-black" />
          01 / Candidate Resume
        </label>
        <span className="text-xs text-[#888888] font-mono">PDF / DOCX • Max 10MB</span>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex-1 relative flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all min-h-[280px] sm:min-h-[310px] ${
          dragOver
            ? 'bg-[#F2F2F2] border-2 border-black ring-4 ring-neutral-200'
            : file
            ? 'bg-emerald-50/30 border-2 border-emerald-300'
            : 'bg-[#F8F8F7] hover:bg-[#F2F2F2] border-2 border-dashed border-[#D4D4D4] hover:border-black'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.doc"
          className="sr-only"
          onChange={handleChange}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-2xs border border-[#E5E5E5] flex items-center justify-center mb-3 text-[#111111]">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-bold text-[#111111] mb-0.5">
                Drop PDF or DOCX here
              </p>
              <p className="text-xs text-[#666666]">
                or <span className="text-[#111111] font-semibold underline">browse</span> from your computer
              </p>
              <span className="text-[11px] text-[#888888] font-mono mt-2.5">
                Max 10 MB
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="text-center flex flex-col items-center w-full px-2"
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-2xs border border-emerald-200 flex items-center justify-center mb-2.5 text-emerald-600">
                <FileText size={24} />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-300 mb-2">
                <CheckCircle2 size={13} className="text-emerald-700" />
                <span>Resume ready</span>
              </div>

              <p className="text-sm font-bold text-[#111111] truncate max-w-full px-2">
                {file.name}
              </p>
              <p className="text-xs text-[#777777] font-mono mt-0.5 mb-3">
                {formatFileSize(file.size)}
              </p>

              <span className="text-xs text-[#111111] hover:text-black font-semibold underline">
                Change file
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </label>

      {error && (
        <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1.5">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
