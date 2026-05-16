export default function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
      <p className="text-sm text-slate-400">{label ?? "Loading data"}</p>
    </div>
  );
}
