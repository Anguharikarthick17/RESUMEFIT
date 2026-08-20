import { useState } from 'react'
import {
  Briefcase,
  Users,
  BarChart3,
  History,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Compass,
  FileCheck2,
  TrendingUp,
} from 'lucide-react'

export type NavTab =
  // Recruiter Tabs
  | 'dashboard'
  | 'jobs'
  | 'screening'
  | 'analytics'
  | 'history'
  // Candidate Tabs
  | 'profile'
  | 'find_jobs'
  | 'applications'
  | 'matches'
  | 'candidate_tools'

interface NavbarProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  userMode: 'recruiter' | 'candidate'
  onToggleMode: (mode: 'recruiter' | 'candidate') => void
  onNewScreening: () => void
}

export default function Navbar({
  currentTab,
  onSelectTab,
  userMode,
  onToggleMode,
  onNewScreening,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-xs">
      <div className="app-container flex items-center justify-between h-16">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm border border-neutral-800">
            RF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-[#111111] text-lg tracking-tight">
                ResumeFit
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#F0F0F0] text-[#111111] px-2 py-0.5 rounded border border-[#E5E5E5]">
                v1.0
              </span>
            </div>
            <p className="text-[9px] text-[#666666] font-mono uppercase tracking-wider font-bold hidden sm:block">
              RECRUITER INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#555555]">
          {userMode === 'recruiter' ? (
            /* Recruiter Navigation */
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <Briefcase size={14} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectTab('jobs')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'jobs'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <Briefcase size={14} />
                <span>Job Openings</span>
              </button>

              <button
                onClick={() => onSelectTab('screening')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'screening'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <Users size={14} />
                <span>Candidates</span>
              </button>

              <button
                onClick={() => onSelectTab('analytics')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'analytics'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <BarChart3 size={14} />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => onSelectTab('history')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'history'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <History size={14} />
                <span>History</span>
              </button>
            </>
          ) : (
            /* Candidate Navigation */
            <>
              <button
                onClick={() => onSelectTab('profile')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'profile'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <UserCheck size={14} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => onSelectTab('find_jobs')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'find_jobs'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <Compass size={14} />
                <span>Find Jobs</span>
              </button>

              <button
                onClick={() => onSelectTab('applications')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'applications'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <FileCheck2 size={14} />
                <span>My Applications</span>
              </button>

              <button
                onClick={() => onSelectTab('matches')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'matches'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <TrendingUp size={14} />
                <span>My Matches</span>
              </button>

              <button
                onClick={() => onSelectTab('candidate_tools')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  currentTab === 'candidate_tools'
                    ? 'bg-black text-white shadow-xs font-bold'
                    : 'hover:text-black hover:bg-neutral-200/50'
                }`}
              >
                <Sparkles size={14} />
                <span>Career Tools</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Section: Mode Toggle & Action */}
        <div className="flex items-center gap-3">
          {/* User Mode Toggle: Recruiter vs Candidate */}
          <div className="flex items-center bg-[#F0F0F0] p-0.5 rounded-xl border border-[#E5E5E5] text-xs font-bold">
            <button
              onClick={() => onToggleMode('recruiter')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                userMode === 'recruiter'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#555555] hover:text-black'
              }`}
            >
              Recruiter
            </button>
            <button
              onClick={() => onToggleMode('candidate')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                userMode === 'candidate'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#555555] hover:text-black'
              }`}
            >
              Candidate
            </button>
          </div>

          {/* New Screening CTA (Recruiter Only) */}
          {userMode === 'recruiter' && (
            <button
              onClick={onNewScreening}
              className="btn-primary text-xs py-2 px-4 shadow-sm hidden sm:flex"
            >
              <PlusCircle size={14} />
              <span>+ New Screening</span>
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
