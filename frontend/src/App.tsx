import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Briefcase,
  Users,
  BarChart3,
  History,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building,
  MapPin,
} from 'lucide-react'
import Navbar, { NavTab } from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import RecruiterDashboard from './components/RecruiterDashboard'
import ScreeningResultsView from './components/ScreeningResultsView'
import ScreeningAnalyticsView from './components/ScreeningAnalyticsView'
import AnalysisHistoryView from './components/AnalysisHistoryView'
import NewScreeningModal from './components/NewScreeningModal'

// Candidate Pages
import CandidateProfileView from './pages/CandidateProfileView'
import FindJobsView from './pages/FindJobsView'
import JobDetailView from './pages/JobDetailView'
import MyApplicationsView from './pages/MyApplicationsView'
import MyMatchesView from './pages/MyMatchesView'

import Results from './pages/Results'
import Analyze from './pages/Analyze'

import type { JobOpening, RankedCandidate, RecruiterDecisionStatus } from './types/recruiter'
import type { CandidateAccount, JobApplicationItem, JobMatchItem } from './types/candidate'
import type { AnalysisResponse } from './types/resume'
import {
  fetchJobsList,
  fetchJobCandidates,
  persistRecruiterDecision,
  fetchCandidateMatches,
  submitCandidateApplication,
  fetchCandidateApplications,
} from './api/resumeFitApi'
import { getAnalysisHistory, saveAnalysisSnapshot } from './utils/intelligenceEngine'

export default function App() {
  const [userMode, setUserMode] = useState<'recruiter' | 'candidate'>('recruiter')
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard')
  
  // Jobs & Screening State
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [activeJob, setActiveJob] = useState<JobOpening | null>(null)
  const [candidates, setCandidates] = useState<RankedCandidate[]>([])
  const [isNewScreeningOpen, setIsNewScreeningOpen] = useState(false)
  const [historyList, setHistoryList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Candidate Portal State
  const [candidateAccount, setCandidateAccount] = useState<CandidateAccount | null>(null)
  const [candidateMatches, setCandidateMatches] = useState<JobMatchItem[]>([])
  const [candidateApplications, setCandidateApplications] = useState<JobApplicationItem[]>([])
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobOpening | null>(null)

  // Career Tools / Single candidate state
  const [singleCandidateData, setSingleCandidateData] = useState<AnalysisResponse | null>(null)

  useEffect(() => {
    loadJobsData()
    setHistoryList(getAnalysisHistory())
  }, [])

  const loadJobsData = async () => {
    setLoading(true)
    try {
      const serverJobs = await fetchJobsList()
      setJobs(serverJobs)
      if (serverJobs.length > 0) {
        if (!activeJob) setActiveJob(serverJobs[0])
        const jobCands = await fetchJobCandidates(serverJobs[0].id)
        setCandidates(jobCands)
      }
    } catch (err) {
      console.error('Failed to load jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Reload candidate matches & applications whenever candidate changes
  useEffect(() => {
    if (candidateAccount?.id) {
      loadCandidateData(candidateAccount.id)
    }
  }, [candidateAccount?.id])

  const loadCandidateData = async (candidateId: string) => {
    try {
      const [matches, apps] = await Promise.all([
        fetchCandidateMatches(candidateId),
        fetchCandidateApplications(candidateId),
      ])
      setCandidateMatches(matches)
      setCandidateApplications(apps)
    } catch (err) {
      console.error('Failed to load candidate matches:', err)
    }
  }

  const handleOpenJobInRecruiter = async (job: JobOpening) => {
    setActiveJob(job)
    setCurrentTab('screening')
    setLoading(true)
    try {
      const cands = await fetchJobCandidates(job.id)
      setCandidates(cands)
    } catch (err) {
      console.error('Failed to load candidates for job:', err)
    } finally {
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCompleteNewScreening = (newJob: JobOpening, newCandidates: RankedCandidate[]) => {
    setActiveJob(newJob)
    setCandidates(newCandidates)
    setIsNewScreeningOpen(false)
    setCurrentTab('screening')
    loadJobsData()
    if (newCandidates.length > 0) {
      setSingleCandidateData(newCandidates[0].data)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdateCandidateDecision = async (candidateId: string, decision: RecruiterDecisionStatus) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, recruiterDecision: decision } : c)),
    )
    await persistRecruiterDecision(candidateId, decision)
    if (candidateAccount?.id) {
      loadCandidateData(candidateAccount.id)
    }
  }

  // Candidate Actions
  const handleCandidateApply = async (job: JobOpening) => {
    if (!candidateAccount?.id) return
    try {
      await submitCandidateApplication(job.id, candidateAccount.id, candidateAccount.resume_id)
      await loadCandidateData(candidateAccount.id)
      await loadJobsData() // sync with recruiter
      setCurrentTab('applications')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to apply:', err)
    }
  }

  const handleSelectSnapshotFromHistory = (snapshot: any) => {
    setSingleCandidateData(snapshot.data)
    setUserMode('candidate')
    setCurrentTab('candidate_tools')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const appliedJobIds = candidateApplications.map((a) => a.job_id)

  return (
    <div className="min-h-screen bg-[#F8F8F7] font-sans text-[#111111]">
      {/* ── Global Header Navigation ── */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={async (tab) => {
          setCurrentTab(tab)
          setSelectedJobForDetail(null)
          if (tab === 'screening') {
            const targetJob = activeJob || (jobs.length > 0 ? jobs[0] : null)
            if (targetJob) {
              setActiveJob(targetJob)
              try {
                const cands = await fetchJobCandidates(targetJob.id)
                setCandidates(cands)
              } catch (e) {
                console.error('Error refreshing candidates:', e)
              }
            }
          }
          if (tab === 'dashboard' || tab === 'jobs') {
            loadJobsData()
          }
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        userMode={userMode}
        onToggleMode={(mode) => {
          setUserMode(mode)
          setSelectedJobForDetail(null)
          if (mode === 'candidate') {
            setCurrentTab(candidateAccount ? 'find_jobs' : 'profile')
          } else {
            setCurrentTab('dashboard')
          }
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onNewScreening={() => setIsNewScreeningOpen(true)}
      />

      <main className="py-6">
        <div className="app-container">
          
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── RECRUITER WORKSPACE MODES ── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {userMode === 'recruiter' && (
            <AnimatePresence mode="wait">
              {/* Tab 1: Dashboard Home */}
              {currentTab === 'dashboard' && (
                <motion.div
                  key="recruiter-dashboard"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ErrorBoundary>
                    <RecruiterDashboard
                      jobs={jobs}
                      onOpenJob={handleOpenJobInRecruiter}
                      onNewScreening={() => setIsNewScreeningOpen(true)}
                      onViewCandidates={() => setCurrentTab('screening')}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}

              {/* Tab 2: Job Openings List */}
              {currentTab === 'jobs' && (
                <motion.div
                  key="recruiter-jobs"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="dash-card p-6 sm:p-8 bg-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F5F5F4] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
                        Supabase Database
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#111111] mt-1">
                        Active Job Openings
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsNewScreeningOpen(true)}
                      className="btn-primary text-xs py-2 px-4 shadow-sm"
                    >
                      <PlusCircle size={14} />
                      <span>+ Create Job</span>
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <div className="dash-card p-8 bg-white text-center text-xs text-[#777777] space-y-3">
                      <Briefcase size={28} className="mx-auto text-[#AAAAAA]" />
                      <p className="font-semibold text-[#111111]">No active job openings yet.</p>
                      <button
                        onClick={() => setIsNewScreeningOpen(true)}
                        className="btn-primary text-xs py-2 px-4 mx-auto"
                      >
                        + Create Your First Screening
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {jobs.map((j) => (
                        <div
                          key={j.id}
                          onClick={() => handleOpenJobInRecruiter(j)}
                          className="dash-card p-6 bg-white space-y-3 cursor-pointer hover:border-[#111111] transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold bg-[#F5F5F4] text-[#111111] px-2 py-0.5 rounded border border-[#E5E5E5]">
                                {j.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-[#777777] font-mono flex items-center gap-1">
                                <Building size={12} />
                                <span>{j.department || 'Engineering'}</span>
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-[#111111]">{j.title}</h4>
                            <p className="text-xs text-[#666666] font-sans line-clamp-2">{j.job_description}</p>
                          </div>
                          <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-xs font-bold text-[#111111]">
                            <span>{j.candidates_count || 0} Applicants</span>
                            <span className="flex items-center gap-1">
                              <span>Open Screening</span>
                              <ArrowRight size={13} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 3: Screening Candidates Table */}
              {currentTab === 'screening' && (
                <motion.div
                  key="recruiter-screening"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ErrorBoundary>
                    {activeJob ? (
                      <ScreeningResultsView
                        job={activeJob}
                        candidates={candidates}
                        onOpenNewScreening={() => setIsNewScreeningOpen(true)}
                        onUpdateCandidateDecision={handleUpdateCandidateDecision}
                      />
                    ) : (
                      <div className="dash-card p-8 bg-white text-center text-xs text-[#777777] space-y-3">
                        <Users size={28} className="mx-auto text-[#AAAAAA]" />
                        <p className="font-semibold text-[#111111]">No active job selected.</p>
                        <button
                          onClick={() => setIsNewScreeningOpen(true)}
                          className="btn-primary text-xs py-2 px-4 mx-auto"
                        >
                          + Start New Screening Session
                        </button>
                      </div>
                    )}
                  </ErrorBoundary>
                </motion.div>
              )}

              {/* Tab 4: Analytics */}
              {currentTab === 'analytics' && (
                <motion.div
                  key="recruiter-analytics"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ErrorBoundary>
                    <ScreeningAnalyticsView
                      jobTitle={activeJob?.title || 'Active Talent Pool'}
                      candidates={candidates}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}

              {/* Tab 5: History */}
              {currentTab === 'history' && (
                <motion.div
                  key="recruiter-history"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ErrorBoundary>
                    <AnalysisHistoryView
                      history={historyList}
                      onSelect={handleSelectSnapshotFromHistory}
                      onRefresh={() => setHistoryList(getAnalysisHistory())}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── CANDIDATE / APPLICANT WORKSPACE MODES ── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {userMode === 'candidate' && (
            <AnimatePresence mode="wait">
              {/* Job Detail Screen (if selected) */}
              {selectedJobForDetail ? (
                <motion.div
                  key="candidate-job-detail"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <JobDetailView
                    job={selectedJobForDetail}
                    candidate={candidateAccount}
                    match={candidateMatches.find((m) => m.job_id === selectedJobForDetail.id)}
                    isApplied={appliedJobIds.includes(selectedJobForDetail.id)}
                    onBack={() => setSelectedJobForDetail(null)}
                    onApply={handleCandidateApply}
                    onNavigateToProfile={() => {
                      setSelectedJobForDetail(null)
                      setCurrentTab('profile')
                    }}
                  />
                </motion.div>
              ) : (
                <>
                  {/* Candidate Tab 1: Profile & Resume */}
                  {currentTab === 'profile' && (
                    <motion.div
                      key="candidate-profile"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <CandidateProfileView
                        candidate={candidateAccount}
                        onUpdateCandidate={(cand) => {
                          setCandidateAccount(cand)
                          if (cand.raw_analysis) {
                            setSingleCandidateData(cand.raw_analysis)
                          }
                        }}
                        onNavigateToJobs={() => setCurrentTab('find_jobs')}
                      />
                    </motion.div>
                  )}

                  {/* Candidate Tab 2: Find Jobs */}
                  {currentTab === 'find_jobs' && (
                    <motion.div
                      key="candidate-find-jobs"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <FindJobsView
                        jobs={jobs}
                        candidate={candidateAccount}
                        matches={candidateMatches}
                        onSelectJob={(j) => setSelectedJobForDetail(j)}
                        onApplyJob={handleCandidateApply}
                        onNavigateToProfile={() => setCurrentTab('profile')}
                        appliedJobIds={appliedJobIds}
                      />
                    </motion.div>
                  )}

                  {/* Candidate Tab 3: My Applications */}
                  {currentTab === 'applications' && (
                    <motion.div
                      key="candidate-applications"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <MyApplicationsView
                        applications={candidateApplications}
                        onExploreJobs={() => setCurrentTab('find_jobs')}
                        onViewJobDetail={(j) => setSelectedJobForDetail(j)}
                      />
                    </motion.div>
                  )}

                  {/* Candidate Tab 4: My Matches */}
                  {currentTab === 'matches' && (
                    <motion.div
                      key="candidate-matches"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <MyMatchesView
                        matches={candidateMatches}
                        jobs={jobs}
                        candidate={candidateAccount}
                        onSelectJob={(j) => setSelectedJobForDetail(j)}
                        onNavigateToProfile={() => setCurrentTab('profile')}
                      />
                    </motion.div>
                  )}

                  {/* Candidate Tab 5: Deep Career Tools (Skill Gaps, Roadmap, Simulators) */}
                  {currentTab === 'candidate_tools' && (
                    <motion.div
                      key="candidate-tools"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {singleCandidateData ? (
                        <ErrorBoundary>
                          <Results
                            data={singleCandidateData}
                            onReset={() => setSingleCandidateData(null)}
                            targetJobDescription={activeJob?.job_description ?? ''}
                          />
                        </ErrorBoundary>
                      ) : (
                        <ErrorBoundary>
                          <Analyze
                            onResults={(data, jd) => {
                              setSingleCandidateData(data)
                              saveAnalysisSnapshot(data, 'Custom Target Role')
                            }}
                            onError={() => {}}
                          />
                        </ErrorBoundary>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          )}

        </div>
      </main>

      {/* ── New Screening Modal (Recruiter Only) ── */}
      {isNewScreeningOpen && (
        <NewScreeningModal
          onClose={() => setIsNewScreeningOpen(false)}
          onCompleteScreening={handleCompleteNewScreening}
        />
      )}
    </div>
  )
}
