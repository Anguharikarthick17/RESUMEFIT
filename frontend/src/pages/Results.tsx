import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Printer,
  ArrowLeft,
  UserCheck,
  FileSearch,
  CheckSquare,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Target,
  Sparkles,
  Award,
  Users,
  Briefcase,
  History,
  TrendingUp,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import type { AnalysisResponse } from '../types/resume'
import type { AnalysisSnapshot, UserMode } from '../types/intelligence'
import FitScore from '../components/FitScore'
import CandidateProfileCard from '../components/CandidateProfile'
import EvidenceExplorer from '../components/EvidenceExplorer'
import RequirementMatrix from '../components/RequirementMatrix'
import SkillGapView from '../components/SkillGapView'
import LearningRoadmapView from '../components/LearningRoadmapView'
import ImprovementSimulatorView from '../components/ImprovementSimulatorView'
import SkillVerificationView from '../components/SkillVerificationView'
import RoleFitSimulatorView from '../components/RoleFitSimulatorView'
import ResumeClaimAnalysisView from '../components/ResumeClaimAnalysisView'
import CandidateComparisonView from '../components/CandidateComparisonView'
import ShortlistAssistantView from '../components/ShortlistAssistantView'
import AnalysisHistoryView from '../components/AnalysisHistoryView'
import ResumeVersionComparisonView from '../components/ResumeVersionComparisonView'
import PrintReportModal from '../components/PrintReportModal'
import {
  analyzeClaimStrength,
  computeEnhancedRequirements,
  computeJobReadinessScore,
  computeRoleFitSimulator,
  computeSkillGaps,
  evaluateRecruiterShortlist,
  generateAnalysisId,
  generateLearningRoadmap,
  getAnalysisHistory,
  getImprovementOptions,
  saveAnalysisSnapshot,
} from '../utils/intelligenceEngine'

interface ResultsProps {
  data: AnalysisResponse
  onReset: () => void
  targetJobDescription?: string
}

export default function Results({ data: initialData, onReset, targetJobDescription = '' }: ResultsProps) {
  const [data, setData] = useState<AnalysisResponse>(initialData)
  const [mode, setMode] = useState<UserMode>('candidate')
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [history, setHistory] = useState<AnalysisSnapshot[]>([])

  // Derived Intelligence Data
  const analysisId = generateAnalysisId(data)
  const { enhanced: enhancedReqs, weighted } = computeEnhancedRequirements(data.requirements)
  const readiness = computeJobReadinessScore(data.fields, data.requirements)
  const skillGaps = computeSkillGaps(data.requirements, data.fields)
  const roadmap = generateLearningRoadmap(skillGaps.missing, skillGaps.partiallyCovered)
  const improvementOptions = getImprovementOptions(data.requirements)
  const claimStrength = analyzeClaimStrength(data.fields)
  const roleFitResults = computeRoleFitSimulator(data.fields)
  const shortlistRec = evaluateRecruiterShortlist(data)

  // Save to history on mount
  useEffect(() => {
    saveAnalysisSnapshot(data)
    setHistory(getAnalysisHistory())
  }, [data])

  const refreshHistory = () => {
    setHistory(getAnalysisHistory())
  }

  const handleSelectSnapshot = (snapshot: AnalysisSnapshot) => {
    setData(snapshot.data)
    setActiveTab('overview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const currentSnapshot: AnalysisSnapshot = {
    analysisId,
    timestamp: new Date().toISOString(),
    candidateName: data.candidate.full_name ?? 'Candidate',
    candidateEmail: data.candidate.email,
    targetRole: 'Software Engineer',
    fitScore: data.fit_score.fit_score,
    weightedScore: weighted.weighted_score,
    jobReadiness: readiness.overall,
    matchedCount: data.fit_score.matched,
    partialCount: data.fit_score.partial,
    missingCount: data.fit_score.missing,
    totalRequirements: data.fit_score.total,
    data,
  }

  // Candidate Mode Navigation Tabs
  const CANDIDATE_TABS = [
    { id: 'overview', label: 'My Profile', icon: UserCheck },
    { id: 'gaps', label: 'Skill Gaps', icon: Target },
    { id: 'roadmap', label: '30-Day Roadmap', icon: Sparkles },
    { id: 'simulator', label: 'What-If Simulator', icon: TrendingUp },
    { id: 'verify', label: 'Verify Skills', icon: Award },
    { id: 'roles', label: 'Role Fit', icon: Briefcase },
    { id: 'versions', label: 'Resume Versions', icon: SlidersHorizontal },
    { id: 'claims', label: 'Claim Audit', icon: ShieldCheck },
  ]

  // Recruiter Mode Navigation Tabs
  const RECRUITER_TABS = [
    { id: 'overview', label: 'Candidate Profile', icon: UserCheck },
    { id: 'evidence', label: 'Evidence Explorer', icon: FileSearch },
    { id: 'requirements', label: 'Requirements Matrix', icon: CheckSquare },
    { id: 'compare', label: 'Compare Candidates', icon: Users },
    { id: 'shortlist', label: 'Shortlist Decision', icon: UserCheck },
    { id: 'history', label: 'Audit History', icon: History },
  ]

  const currentTabs = mode === 'candidate' ? CANDIDATE_TABS : RECRUITER_TABS

  return (
    <div className="min-h-screen pt-6 pb-20 bg-[#F8F8F7] text-[#111111]">
      {/* ── Global 1400px Container ── */}
      <div className="app-container space-y-6">

        {/* ── Top Header Bar & Mode Switcher ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md">
                Analysis ID: {analysisId}
              </span>
              <span className="text-xs text-[#777777] font-mono">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              {mode === 'candidate' ? 'Career Readiness & Job Fit Report' : 'Recruiter Candidate Evaluation'}
            </h1>
          </div>

          {/* Mode Switcher & Global Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dual Audience Mode Switch */}
            <div className="p-1 rounded-xl bg-[#F0F0F0] border border-[#E5E5E5] flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => {
                  setMode('candidate')
                  setActiveTab('overview')
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mode === 'candidate'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-[#666666] hover:text-black'
                }`}
              >
                Candidate View
              </button>
              <button
                onClick={() => {
                  setMode('recruiter')
                  setActiveTab('overview')
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mode === 'recruiter'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-[#666666] hover:text-black'
                }`}
              >
                Recruiter View
              </button>
            </div>

            <button
              onClick={() => setShowPrintModal(true)}
              className="btn-secondary py-2 px-3.5 text-xs font-semibold"
            >
              <Printer size={14} />
              <span>Print Report</span>
            </button>

            <button
              onClick={onReset}
              className="btn-primary py-2 px-4 text-xs font-semibold shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Analyze Another Resume</span>
            </button>
          </div>
        </div>

        {/* ── Candidate Header (Horizontal 1fr 320px Grid) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card p-6 sm:p-8 bg-white"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-center">
            {/* Left: Avatar & Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0 shadow-sm border border-neutral-800">
                {getInitials(data.candidate.full_name)}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777]">
                    EVALUATED CANDIDATE
                  </span>
                  {data.candidate.location && (
                    <span className="text-xs text-[#666666] font-medium flex items-center gap-1">
                      <MapPin size={12} className="text-[#888888]" />
                      {data.candidate.location}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[#111111] leading-tight truncate">
                  {data.candidate.full_name ?? <span className="text-[#888888] font-normal italic">Name Not Found</span>}
                </h2>

                <p className="text-xs sm:text-sm font-semibold text-[#555555]">
                  {data.candidate.most_recent_role ?? data.candidate.highest_degree ?? 'Extracted Candidate Profile'}
                </p>

                {/* Contact Chips */}
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  {data.candidate.email && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[#333333] bg-[#F8F8F7] px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                      <Mail size={12} className="text-[#888888]" /> {data.candidate.email}
                    </span>
                  )}
                  {data.candidate.phone && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[#333333] bg-[#F8F8F7] px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                      <Phone size={12} className="text-[#888888]" /> {data.candidate.phone}
                    </span>
                  )}
                  {data.candidate.linkedin_url && (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#111111] bg-[#F5F5F4] px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                      <ExternalLink size={12} className="text-[#111111]" /> {data.candidate.linkedin_url.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Circular Fit Score */}
            <div className="flex justify-center lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E5E5E5]">
              <FitScore data={data.fit_score} />
            </div>
          </div>
        </motion.div>

        {/* ── Metric Row Cards (4 Equal Columns: Raw Fit, Weighted Fit, Job Readiness, Matched) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] block mb-1">
                RAW FIT SCORE
              </span>
              <div className="text-2xl font-black text-[#111111]">{data.fit_score.fit_score}%</div>
            </div>
            <span className="text-xs text-[#777777] font-sans mt-2 block">
              {data.fit_score.matched} of {data.fit_score.total} matched
            </span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] block mb-1">
                WEIGHTED JOB FIT
              </span>
              <div className="text-2xl font-black text-[#111111]">{weighted.weighted_score}%</div>
            </div>
            <span className="text-xs text-[#777777] font-sans mt-2 block">
              Critical requirements 3x weight
            </span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                JOB READINESS
              </span>
              <div className="text-2xl font-black text-emerald-700">{readiness.overall}%</div>
            </div>
            <span className="text-xs text-emerald-800 font-sans mt-2 block font-medium">
              {readiness.tier}
            </span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777777] block mb-1">
                REQUIREMENT BREAKDOWN
              </span>
              <div className="text-2xl font-black text-[#111111]">
                {data.fit_score.matched} <span className="text-sm font-normal text-[#888888]">/ {data.fit_score.total}</span>
              </div>
            </div>
            <span className="text-xs text-[#777777] font-sans mt-2 block">
              {data.fit_score.partial} partial • {data.fit_score.missing} missing
            </span>
          </div>
        </div>

        {/* ── Segmented Navigation Bar ── */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F4] border border-[#E5E5E5] rounded-xl overflow-x-auto text-xs font-bold text-[#555555]">
          {currentTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Dynamic Tab View Content ── */}
        <div className="pt-2">
          {activeTab === 'overview' && (
            <CandidateProfileCard
              candidate={data.candidate}
              fields={data.fields}
              fitScore={data.fit_score}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceExplorer fields={data.fields} />
          )}

          {activeTab === 'requirements' && (
            <RequirementMatrix requirements={data.requirements} />
          )}

          {activeTab === 'gaps' && (
            <SkillGapView
              youHave={skillGaps.youHave}
              partiallyCovered={skillGaps.partiallyCovered}
              missing={skillGaps.missing}
            />
          )}

          {activeTab === 'roadmap' && (
            <LearningRoadmapView
              roadmap={roadmap}
              onOpenSimulator={() => setActiveTab('simulator')}
            />
          )}

          {activeTab === 'simulator' && (
            <ImprovementSimulatorView
              initialScore={data.fit_score.fit_score}
              options={improvementOptions}
              totalReqs={data.fit_score.total}
              matchedReqs={data.fit_score.matched}
              partialReqs={data.fit_score.partial}
            />
          )}

          {activeTab === 'verify' && (
            <SkillVerificationView
              skills={data.candidate.skills ?? []}
            />
          )}

          {activeTab === 'roles' && (
            <RoleFitSimulatorView
              roles={roleFitResults}
            />
          )}

          {activeTab === 'versions' && (
            <ResumeVersionComparisonView
              currentData={data}
              jobDescription={targetJobDescription}
            />
          )}

          {activeTab === 'claims' && (
            <ResumeClaimAnalysisView
              claims={claimStrength}
            />
          )}

          {activeTab === 'compare' && (
            <CandidateComparisonView
              currentSnapshot={currentSnapshot}
              history={history}
              onSelectCandidate={handleSelectSnapshot}
            />
          )}

          {activeTab === 'shortlist' && (
            <ShortlistAssistantView
              candidate={data.candidate}
              recommendation={shortlistRec}
              fitScore={data.fit_score.fit_score}
              weightedScore={weighted.weighted_score}
            />
          )}

          {activeTab === 'history' && (
            <AnalysisHistoryView
              history={history}
              onSelect={handleSelectSnapshot}
              onRefresh={refreshHistory}
            />
          )}
        </div>

      </div>

      {/* Print Report Modal */}
      {showPrintModal && (
        <PrintReportModal
          data={data}
          weighted={weighted}
          readiness={readiness}
          recommendation={shortlistRec}
          analysisId={analysisId}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  )
}
