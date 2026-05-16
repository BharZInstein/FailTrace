import { Metric } from "@/lib/types";

const toneStyles: Record<Metric["tone"], string> = {
  success: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  warning: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  danger: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  info: "text-blue-300 bg-blue-500/10 border-blue-500/20",
};

export default function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{metric.title}</p>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${toneStyles[metric.tone]}`}
        >
          {metric.change}
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-100">{metric.value}</p>
      <p className="mt-2 text-xs text-slate-500">
        Trend: {metric.trend === "up" ? "Rising" : metric.trend === "down" ? "Falling" : "Stable"}
      </p>
    </div>
  );
}
