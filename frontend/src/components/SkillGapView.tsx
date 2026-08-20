import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Tag } from 'lucide-react'
import type { SkillGapItem } from '../types/intelligence'

interface SkillGapViewProps {
  youHave: SkillGapItem[]
  partiallyCovered: SkillGapItem[]
  missing: SkillGapItem[]
}

export default function SkillGapView({ youHave, partiallyCovered, missing }: SkillGapViewProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillGapItem | null>(
    missing[0] || partiallyCovered[0] || youHave[0] || null,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Candidate Growth & Gap Detection
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Skill Gap Analysis
          </h3>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Linked directly to target Job Description requirements
        </div>
      </div>

      {/* 3 Status Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: YOU HAVE */}
        <div className="dash-card p-5 space-y-3 bg-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <CheckCircle2 size={15} className="text-emerald-600" />
              You Have ({youHave.length})
            </span>
          </div>

          <div className="space-y-2">
            {youHave.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No fully matched skills</p>
            ) : (
              youHave.map((item) => (
                <button
                  key={item.skill}
                  onClick={() => setSelectedSkill(item)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                    selectedSkill?.skill === item.skill
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="truncate max-w-[180px]">{item.skill}</span>
                  <span className="text-[10px] font-mono text-emerald-600">✓ Verified</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 2: PARTIALLY COVERED */}
        <div className="dash-card p-5 space-y-3 bg-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <AlertTriangle size={15} className="text-amber-600" />
              Partially Covered ({partiallyCovered.length})
            </span>
          </div>

          <div className="space-y-2">
            {partiallyCovered.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No partially covered skills</p>
            ) : (
              partiallyCovered.map((item) => (
                <button
                  key={item.skill}
                  onClick={() => setSelectedSkill(item)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                    selectedSkill?.skill === item.skill
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="truncate max-w-[180px]">{item.skill}</span>
                  <span className="text-[10px] font-mono text-amber-600">⚠ Partial</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 3: MISSING */}
        <div className="dash-card p-5 space-y-3 bg-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <XCircle size={15} className="text-rose-600" />
              Missing Skills ({missing.length})
            </span>
          </div>

          <div className="space-y-2">
            {missing.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No missing requirements</p>
            ) : (
              missing.map((item) => (
                <button
                  key={item.skill}
                  onClick={() => setSelectedSkill(item)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                    selectedSkill?.skill === item.skill
                      ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-200'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="truncate max-w-[180px]">{item.skill}</span>
                  <span className="text-[10px] font-mono text-rose-600">✕ Gap</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Selected Skill Details Inspector */}
      <AnimatePresence mode="wait">
        {selectedSkill && (
          <motion.div
            key={selectedSkill.skill}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="dash-card p-6 bg-white space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Selected Skill Gap Detail
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedSkill.skill}
                </h4>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedSkill.status === 'MATCHED'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : selectedSkill.status === 'PARTIAL'
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {selectedSkill.status}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                  Required By Job Description
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                  {selectedSkill.required_by}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                  Associated Resume Grounding Field
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700">
                  {selectedSkill.evidence_field ?? 'None (Zero Grounding Found)'}
                </div>
              </div>
            </div>

            {selectedSkill.evidence_text ? (
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                  Supporting Text from Uploaded Resume
                </label>
                <blockquote className="p-3.5 bg-blue-50/50 border-l-3 border-blue-600 rounded-r-lg text-xs italic text-slate-800">
                  "{selectedSkill.evidence_text}"
                </blockquote>
              </div>
            ) : (
              <div className="p-3 bg-rose-50/50 border border-rose-200/80 rounded-lg text-xs text-rose-700 font-medium">
                This skill is absent from all extracted sections. Adding a hands-on project or verified credential covering this requirement will increase your job-fit score.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
