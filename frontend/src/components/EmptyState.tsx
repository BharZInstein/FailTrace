export default function EmptyState({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 text-center">
      <p className="text-sm text-slate-400">{label ?? "No data available"}</p>
      <p className="text-xs text-slate-500">Awaiting backend signals.</p>
    </div>
  );
}
