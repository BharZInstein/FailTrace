import { FailureFingerprint } from "@/lib/types";

export default function FingerprintCard({
  fingerprint,
}: {
  fingerprint: FailureFingerprint;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {fingerprint.label}
      </p>
      <h4 className="mt-2 text-lg font-semibold text-slate-100">
        {fingerprint.sequence}
      </h4>
      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span>Recovery rate</span>
          <span className="font-semibold text-emerald-300">
            {fingerprint.recoveryRate}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Average retries</span>
          <span className="font-semibold">{fingerprint.avgRetries}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Dominant cause</span>
          <span>{fingerprint.dominantCause}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Replay safety</span>
          <span className="font-semibold text-blue-300">
            {fingerprint.replaySafety}%
          </span>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200">
        Recommended: {fingerprint.action}
      </div>
    </div>
  );
}
