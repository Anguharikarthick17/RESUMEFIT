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
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Audit Trail & History
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            Analysis History
          </h3>
        </div>

        <div className="text-xs text-[#777777] font-mono">
          {history.length} snapshots stored locally
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by candidate name, target role, or analysis ID..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-xs sm:text-sm text-[#111111] placeholder:text-[#888888] outline-none focus:border-black transition-all"
        />
      </div>

      {/* History List */}
      {filtered.length === 0 ? (
        <div className="dash-card p-8 bg-white text-center text-xs text-[#777777] space-y-2">
          <History size={24} className="mx-auto text-[#AAAAAA]" />
          <p className="font-semibold text-[#111111]">No matching analysis history found.</p>
          <p className="text-[#777777]">Analyses are automatically preserved here upon evaluation.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.analysisId}
              onClick={() => onSelect(item)}
              className="dash-card p-4 sm:p-5 bg-white hover:bg-[#FAFAFA] cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5] px-2 py-0.5 rounded">
                    {item.analysisId}
                  </span>
                  <span className="text-xs text-[#777777] font-mono flex items-center gap-1">
                    <Calendar size={11} /> {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#111111] truncate">
                  {item.candidateName}
                </h4>

                <p className="text-xs text-[#666666] truncate">
                  Target: {item.targetRole} • {item.matchedCount} Matched / {item.missingCount} Missing
                </p>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-[#111111]">
                    {item.fitScore}%
                  </span>
                  <span className="text-[10px] text-[#777777] font-mono block">
                    Readiness: {item.jobReadiness}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(e, item.analysisId)}
                    className="p-2 text-[#888888] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
