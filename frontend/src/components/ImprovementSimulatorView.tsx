import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, CheckCircle2, ArrowRight, RefreshCw, Zap } from 'lucide-react'
import type { ImprovementOption, ImprovementSimulationResult } from '../types/intelligence'
import { simulateResumeEnhancement } from '../utils/intelligenceEngine'

interface ImprovementSimulatorViewProps {
  initialScore: number
  options: ImprovementOption[]
  totalReqs: number
  matchedReqs: number
  partialReqs: number
}

export default function ImprovementSimulatorView({
  initialScore,
  options,
  totalReqs,
  matchedReqs,
  partialReqs,
}: ImprovementSimulatorViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [simulation, setSimulation] = useState<ImprovementSimulationResult | null>(null)

  const toggleOption = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSimulate = () => {
    const res = simulateResumeEnhancement(
      initialScore,
      options,
      selectedIds,
      totalReqs,
      matchedReqs,
      partialReqs,
    )
    setSimulation(res)
  }

  const handleSelectAll = () => {
    setSelectedIds(options.map((o) => o.id))
  }

  const handleClearAll = () => {
    setSelectedIds([])
    setSimulation(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Interactive Career Simulation
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            What If I Improve My Resume?
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={handleSelectAll}
            className="text-[#111111] hover:underline font-bold"
          >
            Select All
          </button>
          <span className="text-[#CCCCCC]">•</span>
          <button
            onClick={handleClearAll}
            className="text-[#777777] hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Grid: Left Options Checklist (60%), Right Simulation Projection (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Potential Resume Enhancements */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#777777] font-medium">
            <span>Select potential skills, projects, or certifications to simulate:</span>
            <span className="font-mono">{selectedIds.length} selected</span>
          </div>

          {options.length === 0 ? (
            <div className="p-5 bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl text-center text-xs text-[#777777]">
              Candidate already matches 100% of requirements. No missing requirements available to simulate.
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((opt) => {
                const isSelected = selectedIds.includes(opt.id)
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#F8F8F7] border-black shadow-2xs ring-1 ring-black'
                        : 'bg-white hover:bg-[#FAFAFA] border-[#E5E5E5] shadow-2xs'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(opt.id)}
                      className="mt-1 w-4 h-4 rounded text-black focus:ring-black border-[#CCCCCC]"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-[#111111] leading-snug">
                          {opt.label}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{opt.estimated_impact_pts} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-[#777777] mt-0.5 font-mono truncate">
                        Fulfills requirement: {opt.requirement_matched}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSimulate}
              disabled={selectedIds.length === 0}
              className="btn-primary w-full py-3 text-xs sm:text-sm font-bold shadow-sm disabled:opacity-40"
            >
              <Zap size={14} />
              <span>Simulate Selected Enhancements ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Right Column: Simulation Result Box */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="dash-card p-6 bg-white space-y-5 border border-[#E5E5E5]"
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777]">
                Simulation Projection
              </span>
              <h4 className="text-base font-black text-[#111111] mt-0.5">
                Simulated Match Outcome
              </h4>
            </div>

            {/* Score Comparison Widget */}
            <div className="flex items-center justify-around p-4 bg-[#F8F8F7] border border-[#E5E5E5] rounded-2xl text-center">
              <div>
                <span className="text-[10px] font-mono text-[#777777] font-bold block">
                  CURRENT FIT
                </span>
                <span className="text-2xl font-black font-mono text-[#111111]">
                  {initialScore}%
                </span>
              </div>

              <ArrowRight size={20} className="text-[#AAAAAA]" />

              <div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold block">
                  PROJECTED FIT
                </span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {simulation ? simulation.simulated_score : initialScore}%
                </span>
              </div>
            </div>

            {simulation && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>Score Increase:</span>
                    <span className="font-mono">+{simulation.points_gained} Points</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-800">
                    <span>New Readiness Tier:</span>
                    <span className="font-mono font-bold">{simulation.new_tier}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="font-bold text-[#111111] block">Grounded Summary:</span>
                  <p className="text-[#666666] leading-relaxed">
                    {simulation.summary}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
