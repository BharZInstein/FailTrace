const stateStyles: Record<string, string> = {
  Delivered: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Failed: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  Recovered: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Queued: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

export default function StatusBadge({ state }: { state: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${stateStyles[state] ?? "border-slate-700 text-slate-300"}`}
    >
      {state}
    </span>
  );
}
