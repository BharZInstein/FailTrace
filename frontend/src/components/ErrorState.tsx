export default function ErrorState({
  label,
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 text-center">
      <p className="text-sm text-rose-200">{label ?? "Failed to load data"}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-full border border-rose-400/40 px-3 py-1 text-xs text-rose-200"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
