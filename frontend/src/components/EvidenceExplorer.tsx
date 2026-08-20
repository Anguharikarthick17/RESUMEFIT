import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, HelpCircle, FileText, ShieldCheck } from 'lucide-react'
import type { ExtractedField } from '../types/resume'

const STATUS_CONFIG = {
  FOUND:     { label: 'Found',     pill: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  NOT_FOUND: { label: 'Not Found', pill: 'text-rose-700 bg-rose-50 border-rose-200', icon: XCircle },
  AMBIGUOUS: { label: 'Ambiguous', pill: 'text-amber-700 bg-amber-50 border-amber-200', icon: HelpCircle },
}

interface EvidenceExplorerProps {
  fields: ExtractedField[]
}

export default function EvidenceExplorer({ fields }: EvidenceExplorerProps) {
  const [selectedField, setSelectedField] = useState<ExtractedField | null>(fields[0] || null)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Grounding & Traceability
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Evidence Explorer
          </h3>
        </div>
        <div className="text-xs text-slate-500 font-medium font-mono">
          10 Structured Fields • 100% Verifiable Text Spans
        </div>
      </div>

      {/* Split View: Left 40% (lg:col-span-5), Right 60% (lg:col-span-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 10 Field Cards List (40%) */}
        <div className="lg:col-span-5 space-y-2.5">
          {fields.map((field) => {
            const isSelected = selectedField?.field_id === field.field_id
            const cfg = STATUS_CONFIG[field.status] || STATUS_CONFIG.NOT_FOUND
            const Icon = cfg.icon

            return (
              <button
                key={field.field_id}
                onClick={() => setSelectedField(field)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 shadow-2xs ring-2 ring-blue-200/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {field.field_id}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${cfg.pill}`}>
                    <Icon size={11} />
                    <span>{cfg.label}</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {field.category}
                </div>

                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {field.value ?? field.reason ?? 'Not found in resume'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right Column: Evidence Inspector Panel (60%) */}
        <div className="lg:col-span-7 sticky top-20">
          <AnimatePresence mode="wait">
            {selectedField ? (
              <motion.div
                key={selectedField.field_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="dash-card p-6 sm:p-7 space-y-5"
              >
                {/* Field Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded uppercase">
                      {selectedField.field_id}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-2">
                      {selectedField.category}
                    </h4>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedField.status]?.pill}`}>
                    {STATUS_CONFIG[selectedField.status]?.label}
                  </span>
                </div>

                {/* Extracted Value */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                    Extracted Value
                  </label>
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed break-words">
                    {selectedField.value ?? selectedField.reason ?? 'Not found in resume'}
                  </div>
                </div>

                {/* Source Resume Section */}
                {selectedField.source_section && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1.5">
                      Source Resume Section
                    </label>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200">
                      <FileText size={14} className="text-slate-500" />
                      <span>{selectedField.source_section}</span>
                    </div>
                  </div>
                )}

                {/* Grounded Resume Text Evidence */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Grounded Resume Text Evidence
                    </label>
                    <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck size={13} /> Verifiable Source
                    </span>
                  </div>

                  {selectedField.evidence ? (
                    <blockquote className="p-4 bg-blue-50/50 border-l-4 border-blue-600 rounded-r-xl text-xs sm:text-sm text-slate-800 font-sans italic leading-relaxed whitespace-pre-wrap break-words">
                      "{selectedField.evidence}"
                    </blockquote>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                      Zero grounding evidence detected — field status is NOT_FOUND.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Grounding ID: {selectedField.field_id}</span>
                  <span>Deterministic Trace</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
