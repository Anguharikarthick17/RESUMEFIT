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
    <div className="min-h-screen pt-6 pb-20 bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* ── Global 1400px Container ── */}
      <div className="app-container space-y-6">

        {/* ── Top Header Bar & Mode Switcher ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                Analysis ID: {analysisId}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {mode === 'candidate' ? 'Career Readiness & Job Fit Report' : 'Recruiter Candidate Evaluation'}
            </h1>
          </div>

          {/* Mode Switcher & Global Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dual Audience Mode Switch */}
            <div className="p-1 rounded-xl bg-slate-200/80 flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => {
                  setMode('candidate')
                  setActiveTab('overview')
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mode === 'candidate'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0 shadow-sm">
                {getInitials(data.candidate.full_name)}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    EVALUATED CANDIDATE
                  </span>
                  {data.candidate.location && (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {data.candidate.location}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight truncate">
                  {data.candidate.full_name ?? <span className="text-slate-400 font-normal italic">Name Not Found</span>}
                </h2>

                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  {data.candidate.most_recent_role ?? data.candidate.highest_degree ?? 'Extracted Candidate Profile'}
                </p>

                {/* Contact Chips */}
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  {data.candidate.email && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      <Mail size={12} className="text-slate-400" /> {data.candidate.email}
                    </span>
                  )}
                  {data.candidate.phone && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      <Phone size={12} className="text-slate-400" /> {data.candidate.phone}
                    </span>
                  )}
                  {data.candidate.linkedin_url && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      <ExternalLink size={12} className="text-blue-600" /> {data.candidate.linkedin_url.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Circular Fit Score */}
            <div className="flex justify-center lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
              <FitScore data={data.fit_score} />
            </div>
          </div>
        </motion.div>

        {/* ── Metric Row Cards (4 Equal Columns: Raw Fit, Weighted Fit, Job Readiness, Matched) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                RAW FIT SCORE
              </span>
              <div className="text-2xl font-black text-slate-900">{data.fit_score.fit_score}%</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">
              {data.fit_score.matched} of {data.fit_score.total} matched
            </span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 block mb-1">
                WEIGHTED JOB FIT
              </span>
              <div className="text-2xl font-black text-blue-600">{weighted.weighted_score}%</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">
              Critical requirements 3x weight
            </span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                JOB READINESS
              </span>
              <div className="text-2xl font-black text-emerald-600">{readiness.overall}%</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">
              {readiness.label} index
            </span>
          </div>

          <div className="dash-card p-5 flex flex-col justify-between h-full bg-white">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 block mb-1">
                UNMATCHED GAPS
              </span>
              <div className="text-2xl font-black text-rose-600">{data.fit_score.missing}</div>
            </div>
            <span className="text-xs text-slate-500 font-sans mt-2 block">
              {data.fit_score.partial} partial coverage
            </span>
          </div>
        </div>

        {/* ── Segmented Navigation Tabs for Selected Mode ── */}
        <div className="dash-card p-1.5 bg-slate-100 border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {currentTabs.map((t) => {
              const isActive = activeTab === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'segment-btn-active'
                      : 'segment-btn-inactive'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Active Tab Panes ── */}
        <motion.div
          key={`${mode}-${activeTab}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Common: Overview */}
          {activeTab === 'overview' && (
            <CandidateProfileCard candidate={data.candidate} fields={data.fields} fitScore={data.fit_score} />
          )}

          {/* Candidate Mode Tabs */}
          {mode === 'candidate' && activeTab === 'gaps' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <SkillGapView
                youHave={skillGaps.youHave}
                partiallyCovered={skillGaps.partiallyCovered}
                missing={skillGaps.missing}
              />
            </div>
          )}

          {mode === 'candidate' && activeTab === 'roadmap' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <LearningRoadmapView
                roadmap={roadmap}
                onOpenSimulator={() => setActiveTab('simulator')}
              />
            </div>
          )}

          {mode === 'candidate' && activeTab === 'simulator' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <ImprovementSimulatorView
                currentFit={data.fit_score.fit_score}
                allRequirements={data.requirements}
                options={improvementOptions}
                onOpenVersions={() => setActiveTab('versions')}
              />
            </div>
          )}

          {mode === 'candidate' && activeTab === 'verify' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <SkillVerificationView
                extractedSkills={data.fields.find((f) => f.field_id === 'SKILLS-LIST')?.value?.split(',') ?? []}
              />
            </div>
          )}

          {mode === 'candidate' && activeTab === 'roles' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <RoleFitSimulatorView roles={roleFitResults} />
            </div>
          )}

          {mode === 'candidate' && activeTab === 'versions' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <ResumeVersionComparisonView
                currentData={data}
                targetJobDescription={targetJobDescription}
                onApplyNewVersion={(newData) => setData(newData)}
              />
            </div>
          )}

          {mode === 'candidate' && activeTab === 'claims' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <ResumeClaimAnalysisView claims={claimStrength} />
            </div>
          )}

          {/* Recruiter Mode Tabs */}
          {mode === 'recruiter' && activeTab === 'evidence' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <EvidenceExplorer fields={data.fields} />
            </div>
          )}

          {mode === 'recruiter' && activeTab === 'requirements' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <RequirementMatrix requirements={enhancedReqs} />
            </div>
          )}

          {mode === 'recruiter' && activeTab === 'compare' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <CandidateComparisonView
                currentSnapshot={currentSnapshot}
                history={history}
                onSelectCandidate={handleSelectSnapshot}
              />
            </div>
          )}

          {mode === 'recruiter' && activeTab === 'shortlist' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <ShortlistAssistantView
                candidate={data.candidate}
                recommendation={shortlistRec}
                fitScore={data.fit_score.fit_score}
                weightedScore={weighted.weighted_score}
              />
            </div>
          )}

          {mode === 'recruiter' && activeTab === 'history' && (
            <div className="dash-card p-6 sm:p-8 bg-white">
              <AnalysisHistoryView
                history={history}
                onSelect={handleSelectSnapshot}
                onRefresh={refreshHistory}
              />
            </div>
          )}
        </motion.div>

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
