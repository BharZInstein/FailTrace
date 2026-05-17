"use client";

import { FormEvent, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import HealthBar from "@/components/HealthBar";
import ScoreRing from "@/components/ScoreRing";
import { SkeletonBlock } from "@/components/Skeleton";
import { AnalyzeResult, analyzeEvent, formatState } from "@/lib/failtrace-api";

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#1f1f1f] bg-[#111111] p-4">
      <div className="text-xs uppercase tracking-wide text-[#6b7280]">{label}</div>
      <div className="mt-2 break-words font-mono text-sm text-white">{value}</div>
    </div>
  );
}

export default function AnalyzePage() {
  const [eventId, setEventId] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!eventId.trim()) return;
    try {
      setLoading(true);
      setError("");
      setResult(await analyzeEvent(eventId.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze event");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-[#00ff94]">Replay decision</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Event Analyzer</h1>
      </div>

      <form onSubmit={submit} className="flex gap-3 border border-[#1f1f1f] bg-[#111111] p-4">
        <input
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
          placeholder="evt_brqz42"
          className="min-w-0 flex-1 border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#00ff94]"
        />
        <button className="border border-[#00ff94]/40 bg-[#00ff94] px-4 py-2 text-sm font-medium text-black">
          Analyze
        </button>
      </form>

      {error && <ErrorBanner message={error} />}
      {loading && <SkeletonBlock className="h-96 w-full" />}

      {result && !loading && (
        <section className="space-y-5">
          <div
            className={`border p-5 ${
              result.safe_to_replay
                ? "border-[#00ff94]/40 bg-[#00ff94]/10 text-[#00ff94]"
                : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#fecaca]"
            }`}
          >
            <div className="font-mono text-xs uppercase tracking-wide">Replay verdict</div>
            <div className="mt-2 text-3xl font-semibold">
              {result.safe_to_replay ? "SAFE TO REPLAY" : "UNSAFE TO REPLAY"}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Delivery State" value={formatState(result.delivery_state)} />
              <Field label="Failure Reason" value={formatState(result.failure_reason)} />
              <Field label="Recommended Action" value={result.recommended_action} />
              <Field label="Endpoint" value={result.endpoint_id} />
              <div className="border border-[#1f1f1f] bg-[#111111] p-4 md:col-span-2">
                <div className="text-xs uppercase tracking-wide text-[#6b7280]">Health Score</div>
                <div className="mt-4">
                  <HealthBar value={result.endpoint_health_score} />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border border-[#1f1f1f] bg-[#111111] p-6">
              <div className="mb-4 text-xs uppercase tracking-wide text-[#6b7280]">Replay Confidence</div>
              <ScoreRing value={result.replay_confidence_score} />
            </div>
          </div>

          <div className="border border-[#1f1f1f] bg-[#111111] p-4">
            <div className="mb-3 text-sm font-medium text-white">Explanation</div>
            <ul className="space-y-2 text-sm text-[#d1d5db]">
              {result.explanation.map((item) => (
                <li key={item} className="border-l border-[#1f1f1f] pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
