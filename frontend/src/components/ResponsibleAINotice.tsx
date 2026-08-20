import { ShieldAlert, UserCheck } from 'lucide-react'

export default function ResponsibleAINotice() {
  return (
    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-slate-700">
      <UserCheck size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <span className="font-bold text-slate-900">
          Responsible AI Screening Notice:
        </span>
        <p className="text-slate-600 leading-relaxed">
          ResumeFit provides transparent, evidence-grounded screening assistance to help recruiters prioritize reviews. All recommendations are derived strictly from job-relevant qualifications. Final hiring decisions remain 100% human-in-the-loop.
        </p>
      </div>
    </div>
  )
}
