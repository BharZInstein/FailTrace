"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusCodeBadge, default as StatusBadge } from "@/components/StatusBadge";
import HealthBar from "@/components/HealthBar";
import { FailTraceEvent, getEvents } from "@/lib/failtrace-api";

const capabilities = [
  {
    title: "Catch the failure mode",
    body: "Sort deliveries by retry count, status code, and endpoint health before the noise spreads across the queue.",
  },
  {
    title: "Make a replay call",
    body: "See whether an event is safe to replay, unsafe to replay, or better left alone until the endpoint is healthy.",
  },
  {
    title: "Trace the endpoint",
    body: "Pull recent event history and score trends into one view so operators can move from alert to action quickly.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Ingest webhook telemetry",
    body: "Pull in event history, retry attempts, and status codes from your delivery pipeline.",
  },
  {
    step: "02",
    title: "Classify the risk",
    body: "FailTrace scores health, flags signatures or rate limits, and marks replay safety.",
  },
  {
    step: "03",
    title: "Act from the right screen",
    body: "Jump into the dashboard, analyze a single event, or inspect endpoint health without changing tools.",
  },
];

export default function HomePage() {
  const [previewEvents, setPreviewEvents] = useState<FailTraceEvent[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoadingPreview(true);
        setPreviewError("");
        const events = await getEvents();
        setPreviewEvents(events.slice(0, 3));
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : "Unable to load recent webhook decisions");
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreview();
  }, []);

  return (
    <div className="space-y-12">
      <section
        className="relative overflow-hidden border border-[#1f1f1f] bg-[#0d0d0d] px-6 py-10 sm:px-8"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.96),rgba(10,10,10,0.86))]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-wide text-[#00ff94]">Webhook reliability control</p>
            <h1 className="max-w-[10ch] text-5xl font-semibold leading-[0.92] text-white">FailTrace</h1>
            <p className="max-w-2xl text-base leading-7 text-[#d1d5db]">
              Webhook reliability, replay decisions, and endpoint health in one operating view. Start with the
              landing page, then drop into the dashboard when you need the live queue.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="border border-[#00ff94]/40 bg-[#00ff94] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                Open dashboard
              </Link>
              <Link
                href="/analyze"
                className="border border-[#1f1f1f] bg-[#111111] px-4 py-2 text-sm text-[#f9fafb] transition hover:border-[#00ff94]/40 hover:text-[#00ff94]"
              >
                Analyze an event
              </Link>
              <Link
                href="/endpoints"
                className="border border-[#1f1f1f] bg-[#111111] px-4 py-2 text-sm text-[#f9fafb] transition hover:border-[#00ff94]/40 hover:text-[#00ff94]"
              >
                Inspect endpoints
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Replay safety", "Blocks risky retries"],
                ["Endpoint health", "Scores recent delivery behavior"],
                ["Operator flow", "Dashboard, analyzer, endpoint view"],
              ].map(([label, value]) => (
                <div key={label} className="border border-[#1f1f1f] bg-[#111111] p-4">
                  <div className="text-xs uppercase tracking-wide text-[#6b7280]">{label}</div>
                  <div className="mt-2 text-sm text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#1f1f1f] bg-[#111111]/95 p-4">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <div>
                <div className="font-mono text-xs uppercase tracking-wide text-[#6b7280]">Operational snapshot</div>
                <div className="mt-1 text-sm text-white">Recent webhook decisions</div>
              </div>
              <div className="font-mono text-xs text-[#6b7280]">Live preview</div>
            </div>

            <div className="mt-4 space-y-3">
              {previewError && (
                <div className="border border-[#7f1d1d] bg-[#190d0d] px-3 py-2 text-sm text-[#fecaca]">
                  {previewError}
                </div>
              )}
              {loadingPreview && (
                <div className="border border-[#1f1f1f] bg-[#0d0d0d] p-3 text-sm text-[#6b7280]">
                  Loading recent webhook decisions...
                </div>
              )}
              {previewEvents.map((event) => (
                <div key={event.event_id} className="border border-[#1f1f1f] bg-[#0d0d0d] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-white">{event.event_id}</div>
                      <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-[#6b7280]">
                        {event.endpoint_id.replace("ep_", "").replaceAll("_", "-")}
                      </div>
                    </div>
                    <StatusCodeBadge code={event.status_code} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge state={event.delivery_state} />
                    <span className="border border-[#1f1f1f] px-2 py-0.5 font-mono text-[#d1d5db]">
                      {event.recommended_action}
                    </span>
                  </div>
                  <div className="mt-3">
                    <HealthBar value={event.endpoint_health_score} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {capabilities.map((item) => (
          <div key={item.title} className="border border-[#1f1f1f] bg-[#111111] p-5">
            <div className="font-mono text-xs uppercase tracking-wide text-[#00ff94]">{item.title}</div>
            <p className="mt-3 text-sm leading-6 text-[#d1d5db]">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 border-y border-[#1f1f1f] py-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-[#00ff94]">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Built for the handoff between incident, replay, and cleanup.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {workflow.map((item) => (
            <div key={item.step} className="border border-[#1f1f1f] bg-[#111111] p-4">
              <div className="font-mono text-xs uppercase tracking-wide text-[#6b7280]">{item.step}</div>
              <div className="mt-3 text-sm font-medium text-white">{item.title}</div>
              <p className="mt-2 text-sm leading-6 text-[#d1d5db]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 border border-[#1f1f1f] bg-[#111111] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-wide text-[#6b7280]">Next step</div>
          <p className="mt-2 text-sm text-[#d1d5db]">Open the dashboard for live metrics, recent events, and endpoint health.</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex border border-[#00ff94]/40 bg-[#00ff94] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
        >
          Go to dashboard
        </Link>
      </section>
    </div>
  );
}
