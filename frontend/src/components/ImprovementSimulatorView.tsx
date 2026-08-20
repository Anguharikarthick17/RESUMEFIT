import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, CheckSquare, PlusCircle, ArrowRight } from 'lucide-react'
import type { ImprovementOption, SimulationResult } from '../types/intelligence'
import type { RequirementMatch } from '../types/resume'
import { simulateImprovements } from '../utils/intelligenceEngine'

interface ImprovementSimulatorViewProps {
  currentFit: number
  allRequirements: RequirementMatch[]
  options: ImprovementOption[]
  onOpenVersions?: () => void
}

export default function ImprovementSimulatorView({
  currentFit,
  allRequirements,
  options,
  onOpenVersions,
}: ImprovementSimulatorViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)

  const toggleOption = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSimulate = () => {
    const result = simulateImprovements(currentFit, allRequirements, selectedIds, options)
    setSimulation(result)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Interactive Career Simulation
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            What If I Improve My Resume?
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleSelectAll}
            className="text-blue-600 hover:underline font-semibold"
          >
            Select All
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={handleClearAll}
            className="text-slate-500 hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Grid: Left Options Checklist (60%), Right Simulation Projection (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Potential Resume Enhancements */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Select potential skills, projects, or certifications to simulate:</span>
            <span className="font-mono">{selectedIds.length} selected</span>
          </div>

          {options.length === 0 ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
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
                        ? 'bg-blue-50/90 border-blue-500 shadow-2xs ring-2 ring-blue-200/50'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(opt.id)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {opt.label}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{opt.estimated_impact_pts} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
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
              className="btn-primary w-full py-3 text-xs sm:text-sm font-bold shadow-sm"
            >
              <Sparkles size={15} />
              <span>Simulate Selected Improvements ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Right Column: Real-Time Score Projection */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="dash-card p-6 bg-white space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Deterministic Projection
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                Fit Score Evolution
              </h4>
            </div>

            {/* Score Comparison Visual */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  CURRENT FIT
                </span>
                <span className="text-3xl font-black text-slate-900">
                  {currentFit}%
                </span>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block mb-1">
                  PROJECTED FIT
                </span>
                <span className="text-3xl font-black text-emerald-700">
                  {simulation ? `${simulation.projected_fit}%` : `${currentFit}%`}
                </span>
              </div>
            </div>

            {/* Projected Gain Badge */}
            {simulation && simulation.delta > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-700" />
                  <span>Projected Growth:</span>
                </div>
                <span className="text-sm font-black font-mono text-emerald-800">
                  +{simulation.delta} Percentage Points
                </span>
              </motion.div>
            ) : null}

            {/* Simulated Requirement Counts */}
            {simulation ? (
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Projected Matched Requirements:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {simulation.new_matched_count}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Remaining Gaps:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {simulation.new_missing_count}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                Select one or more improvements on the left and click "Simulate" to calculate projected fit.
              </p>
            )}

            {onOpenVersions && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={onOpenVersions}
                  className="btn-secondary w-full text-xs py-2"
                >
                  <span>Compare with Resume v2 →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
