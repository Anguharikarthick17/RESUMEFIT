import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, HelpCircle, Award, ArrowRight, RotateCcw } from 'lucide-react'
import { ASSESSMENT_BANK } from '../utils/intelligenceEngine'
import type { AssessmentQuestion, AssessmentResult } from '../types/intelligence'

interface SkillVerificationViewProps {
  extractedSkills: string[]
}

export default function SkillVerificationView({ extractedSkills }: SkillVerificationViewProps) {
  const availableCategories = Object.keys(ASSESSMENT_BANK)
  const [selectedCategory, setSelectedCategory] = useState<string>(availableCategories[0])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [results, setResults] = useState<AssessmentResult | null>(null)

  const questions: AssessmentQuestion[] = ASSESSMENT_BANK[selectedCategory] || []

  const handleSelectAnswer = (idx: number) => {
    setSelectedAnswer(idx)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)
    setSelectedAnswer(null)

    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1)
    } else {
      // Calculate score
      let correct = 0
      for (let i = 0; i < questions.length; i++) {
        if (newAnswers[i] === questions[i].correct_index) correct++
      }
      const pct = Math.round((correct / questions.length) * 100)

      setResults({
        category: selectedCategory,
        score: correct,
        total: questions.length,
        percentage: pct,
        claim_status: 'Partial evidence extracted in resume',
        combined_status: pct >= 70 ? 'Assessment Verified ✓' : 'Needs Practice ⚠',
        completed_at: new Date().toLocaleDateString(),
      })
    }
  }

  const handleReset = (cat: string) => {
    setSelectedCategory(cat)
    setCurrentQuestionIdx(0)
    setSelectedAnswer(null)
    setAnswers([])
    setResults(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
            Direct Capability Verification
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Verify Your Skills
          </h3>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Assessment performance evaluated independently from resume claims
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleReset(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Assessment Container */}
      {!results ? (
        <div className="dash-card p-6 sm:p-8 bg-white max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-mono text-slate-400 font-bold">
            <span>{selectedCategory.toUpperCase()} READINESS TEST</span>
            <span>
              QUESTION {currentQuestionIdx + 1} OF {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {questions[currentQuestionIdx]?.question}
          </h4>

          {/* Options */}
          <div className="space-y-2.5">
            {questions[currentQuestionIdx]?.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => handleSelectAnswer(oIdx)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${
                  selectedAnswer === oIdx
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-200'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <span>{opt}</span>
                <span className="text-[11px] font-mono text-slate-400">Option {String.fromCharCode(65 + oIdx)}</span>
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="btn-primary text-xs sm:text-sm py-2.5 px-6 shadow-sm disabled:opacity-40"
            >
              <span>{currentQuestionIdx + 1 === questions.length ? 'Submit Assessment' : 'Next Question'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="dash-card p-6 sm:p-8 bg-white max-w-2xl mx-auto space-y-6 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-600">
            <Award size={28} />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              Assessment Completed
            </span>
            <h4 className="text-2xl font-black text-slate-900 mt-2">
              {results.category} Assessment Score: {results.percentage}%
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Answered {results.score} of {results.total} questions correctly.
            </p>
          </div>

          {/* Status Breakdown Grid */}
          <div className="grid grid-cols-2 gap-4 text-left pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                RESUME EVIDENCE
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {results.claim_status}
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block mb-1">
                ASSESSMENT STATUS
              </span>
              <p className="text-xs font-bold text-emerald-900">
                {results.combined_status}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-center gap-3">
            <button
              onClick={() => handleReset(selectedCategory)}
              className="btn-secondary text-xs py-2 px-4"
            >
              <RotateCcw size={13} />
              <span>Retake Assessment</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
