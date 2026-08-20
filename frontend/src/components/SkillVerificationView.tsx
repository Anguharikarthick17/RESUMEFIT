import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Award, ArrowRight, RefreshCw, HelpCircle, ShieldCheck } from 'lucide-react'
import type { AssessmentQuestion, AssessmentResult } from '../types/intelligence'
import { getAssessmentQuestions, gradeAssessment } from '../utils/intelligenceEngine'

interface SkillVerificationViewProps {
  skills: string[]
}

export default function SkillVerificationView({ skills }: SkillVerificationViewProps) {
  const availableCategories = ['Core Java', 'Spring Framework', 'SQL & Databases', 'System Architecture']
  const [selectedCategory, setSelectedCategory] = useState<string>(availableCategories[0])
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(() =>
    getAssessmentQuestions(availableCategories[0]),
  )
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [results, setResults] = useState<AssessmentResult | null>(null)

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return
    const updated = [...userAnswers, selectedAnswer]
    setUserAnswers(updated)
    setSelectedAnswer(null)

    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1)
    } else {
      // Grade test
      const res = gradeAssessment(selectedCategory, questions, updated)
      setResults(res)
    }
  }

  const handleReset = (category: string) => {
    setSelectedCategory(category)
    setQuestions(getAssessmentQuestions(category))
    setCurrentQuestionIdx(0)
    setUserAnswers([])
    setSelectedAnswer(null)
    setResults(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dash-card p-6 sm:p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
            Direct Capability Verification
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111111] mt-1">
            Verify Your Skills
          </h3>
        </div>

        <div className="text-xs text-[#777777] font-mono">
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
                ? 'bg-black text-white border-black shadow-2xs'
                : 'bg-white text-[#333333] hover:bg-[#F5F5F4] border-[#E5E5E5]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Assessment Container */}
      {!results ? (
        <div className="dash-card p-6 sm:p-8 bg-white max-w-2xl mx-auto space-y-6 border border-[#E5E5E5]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5] text-xs font-mono text-[#777777] font-bold">
            <span>{selectedCategory.toUpperCase()} READINESS TEST</span>
            <span>
              QUESTION {currentQuestionIdx + 1} OF {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <h4 className="text-base sm:text-lg font-bold text-[#111111] leading-snug">
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
                    ? 'bg-[#F8F8F7] border-black text-[#111111] ring-1 ring-black'
                    : 'bg-[#F8F8F7] hover:bg-[#F2F2F2] border-[#E5E5E5] text-[#333333]'
                }`}
              >
                <span>{opt}</span>
                <span className="text-[11px] font-mono text-[#777777]">Option {String.fromCharCode(65 + oIdx)}</span>
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-[#E5E5E5] flex justify-end">
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
          className="dash-card p-6 sm:p-8 bg-white max-w-2xl mx-auto space-y-6 text-center border border-[#E5E5E5]"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F5F5F4] border border-[#E5E5E5] mx-auto flex items-center justify-center text-[#111111]">
            <Award size={28} />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md">
              Assessment Completed
            </span>
            <h4 className="text-2xl font-black text-[#111111] mt-2">
              {results.category} Assessment Score: {results.percentage}%
            </h4>
            <p className="text-xs text-[#666666] mt-1">
              Answered {results.score} of {results.total} questions correctly.
            </p>
          </div>

          <div className="p-4 bg-[#F8F8F7] border border-[#E5E5E5] rounded-xl text-xs space-y-2 text-left">
            <span className="font-bold text-[#111111] block font-mono uppercase text-[10px]">
              Evidence-Grounded Capability Impact:
            </span>
            <p className="text-[#555555] leading-relaxed font-sans">
              Passing verified skill assessments independently strengthens candidate credibility beyond self-reported resume claims.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => handleReset(selectedCategory)}
              className="btn-secondary text-xs py-2.5 px-6 font-bold"
            >
              <RefreshCw size={13} />
              <span>Retake or Try Another Assessment</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
