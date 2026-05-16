import { Recommendation } from "@/lib/types";

const severityStyles: Record<Recommendation["severity"], string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-200",
};

export default function RecommendationPanel({
  items,
}: {
  items: Recommendation[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-2xl border px-4 py-3 ${severityStyles[item.severity]}`}
        >
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs text-slate-200/80">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
