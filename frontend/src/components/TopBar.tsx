export default function TopBar() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Observability Command
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-100">
          Adaptive Webhook Reliability & Replay Intelligence System
        </h2>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
          Last sync: 40s
        </span>
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300">
          Replay Analyzer Active
        </span>
        <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-blue-300">
          Adaptive Retry Optimizer
        </span>
      </div>
    </div>
  );
}
