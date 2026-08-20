import { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Quote,
  Layers,
  Search,
} from 'lucide-react'
import type { ExtractedField } from '../types/resume'

interface EvidenceExplorerProps {
  fields: ExtractedField[]
}

export default function EvidenceExplorer({ fields }: EvidenceExplorerProps) {
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const categories = Array.from(new Set(fields.map((f) => f.category)))

  const filteredFields = fields.filter((f) => {
    const matchesCat = filterCategory === 'ALL' || f.category === filterCategory
    const matchesSearch =
      f.field_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.value && f.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.evidence && f.evidence.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCat && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fields or evidence..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-lg text-xs text-[#111111] placeholder:text-[#888888] outline-none focus:border-black focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
              filterCategory === 'ALL'
                ? 'bg-black border-black text-white'
                : 'bg-white border-[#E5E5E5] text-[#555555] hover:bg-[#F5F5F4]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                filterCategory === cat
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-[#E5E5E5] text-[#555555] hover:bg-[#F5F5F4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        {filteredFields.map((field, idx) => {
          const isFound = field.status === 'FOUND'
          const isPartial = field.status === 'PARTIAL'

          return (
            <div
              key={idx}
              className="dash-card p-4 bg-white border border-[#E5E5E5] space-y-2.5 hover:border-[#CCCCCC] transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase bg-[#F5F5F4] text-[#111111] px-2 py-0.5 rounded border border-[#E5E5E5]">
                    {field.category}
                  </span>
                  <span className="font-bold text-xs text-[#111111]">
                    {field.field_id}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    isFound
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isPartial
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {field.status}
                </span>
              </div>

              {/* Extracted Value */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#777777] block">
                  Extracted Canonical Value
                </span>
                <p className="text-xs font-semibold text-[#111111] mt-0.5">
                  {field.value || <span className="text-[#888888] italic">Not extracted</span>}
                </p>
              </div>

              {/* Verbatim Grounded Quote Snippet */}
              {field.evidence && (
                <div className="p-3 bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#777777]">
                    <Quote size={10} className="text-[#111111]" />
                    <span>Verbatim Source Evidence (Section: {field.section_grounding || 'Extracted Text'})</span>
                  </div>
                  <p className="text-[11px] text-[#333333] font-mono italic leading-relaxed">
                    "{field.evidence}"
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
