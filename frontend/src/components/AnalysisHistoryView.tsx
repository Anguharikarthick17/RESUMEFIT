import { useState } from 'react'
import { motion } from 'framer-motion'
import { History, Search, ArrowRight, Trash2, Calendar, FileText } from 'lucide-react'
import type { AnalysisSnapshot } from '../types/intelligence'
import { deleteAnalysisFromHistory } from '../utils/intelligenceEngine'

interface AnalysisHistoryViewProps {
  history: AnalysisSnapshot[]
  onSelect: (snapshot: AnalysisSnapshot) => void
  onRefresh: () => void
}

export default function AnalysisHistoryView({ history, onSelect, onRefresh }: AnalysisHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = history.filter(
    (h) =>
      h.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.analysisId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteAnalysisFromHistory(id)
    onRefresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Audit Trail & History
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Analysis History
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {history.length} snapshots stored locally
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by candidate name, target role, or analysis ID..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* History List */}
      {filtered.length === 0 ? (
        <div className="dash-card p-8 bg-white text-center text-xs text-slate-500 space-y-2">
          <History size={24} className="mx-auto text-slate-400" />
          <p className="font-semibold text-slate-700">No matching analysis history found.</p>
          <p className="text-slate-400">Analyses are automatically preserved here upon evaluation.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.analysisId}
              onClick={() => onSelect(item)}
              className="dash-card p-4 sm:p-5 bg-white hover:bg-slate-50/80 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {item.analysisId}
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar size={11} /> {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {item.candidateName}
                </h4>

                <p className="text-xs text-slate-500 truncate">
                  Target: {item.targetRole} • {item.matchedCount} Matched / {item.missingCount} Missing
                </p>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-blue-600">
                    {item.fitScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Readiness: {item.jobReadiness}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(e, item.analysisId)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete snapshot"
                  >
                    <Trash2 size={15} />
                  </button>

                  <button className="btn-secondary text-xs py-1.5 px-3">
                    <span>View Report</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
