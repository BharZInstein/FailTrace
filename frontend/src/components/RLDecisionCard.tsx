import { RLDecision } from "@/lib/types";

export default function RLDecisionCard({ decision }: { decision: RLDecision }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-slate-100">{decision.action}</p>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-200">
          {decision.confidence}% confidence
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400">{decision.insight}</p>
      <p className="mt-3 text-xs text-emerald-300">
        Expected replay success lift: +{decision.outcomeLift}%
      </p>
    </div>
  );
}
