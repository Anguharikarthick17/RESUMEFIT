import { ShieldCheck, Info } from 'lucide-react'

export default function ResponsibleAINotice() {
  return (
    <div className="dash-card p-4 sm:p-5 bg-white border border-[#E5E5E5] flex items-start gap-3.5 text-xs text-[#555555]">
      <div className="p-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E5] text-[#111111] flex-shrink-0 mt-0.5">
        <ShieldCheck size={16} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#111111] uppercase font-mono text-[10px] tracking-wider">
            Responsible AI & Grounded Screening Policy
          </span>
          <span className="text-[10px] font-mono bg-[#F5F5F4] text-[#111111] px-1.5 py-0.2 rounded border border-[#E5E5E5]">
            Human-In-The-Loop
          </span>
        </div>

        <p className="leading-relaxed font-sans text-[#666666]">
          ResumeFit provides deterministic qualification matching and verbatim evidence traces. AI recommendations are assistive — final hiring decisions remain 100% with the human recruiter. Scoring evaluates only job-relevant skills, experience, and education, never protected personal attributes.
        </p>
      </div>
    </div>
  )
}
