import { CheckCircle2, AlertTriangle, XCircle, Quote } from 'lucide-react'
import type { RequirementMatch } from '../types/resume'

interface RequirementMatrixProps {
  requirements: RequirementMatch[]
}

export default function RequirementMatrix({ requirements }: RequirementMatrixProps) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8F8F7] text-[#777777] font-mono font-bold border-b border-[#E5E5E5] uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 w-28">Status</th>
              <th className="py-3 px-4">Requirement</th>
              <th className="py-3 px-4 w-32">Matched Field</th>
              <th className="py-3 px-4">Verbatim Evidence Snippet</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E5E5E5]">
            {requirements.map((req, idx) => {
              const isMatched = req.match_status === 'MATCHED'
              const isPartial = req.match_status === 'PARTIAL'

              return (
                <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        isMatched
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isPartial
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {isMatched ? (
                        <CheckCircle2 size={11} className="text-emerald-600" />
                      ) : isPartial ? (
                        <AlertTriangle size={11} className="text-amber-600" />
                      ) : (
                        <XCircle size={11} className="text-rose-600" />
                      )}
                      <span>{req.match_status}</span>
                    </span>
                  </td>

                  {/* Requirement Name */}
                  <td className="py-3 px-4 font-semibold text-[#111111]">
                    {req.requirement}
                  </td>

                  {/* Matched Field */}
                  <td className="py-3 px-4 font-mono text-[11px] text-[#555555]">
                    {req.evidence_field || <span className="text-[#888888] italic">NOT_FOUND</span>}
                  </td>

                  {/* Evidence Snippet */}
                  <td className="py-3 px-4 text-[#555555]">
                    {req.evidence_snippet ? (
                      <span className="font-mono text-[11px] italic text-[#333333] bg-[#F8F8F7] px-2 py-1 rounded border border-[#E5E5E5] block">
                        "{req.evidence_snippet}"
                      </span>
                    ) : (
                      <span className="text-[#888888] italic text-[11px]">No supporting text found in resume</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
