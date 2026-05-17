"use client";

import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import HealthBar from "./HealthBar";
import { StatusCodeBadge } from "./StatusBadge";
import { EndpointMonitor, formatDate } from "@/lib/failtrace-api";

export default function EndpointDrawer({
  endpoint,
  onClose,
}: {
  endpoint: EndpointMonitor;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    void Promise.resolve().then(() => setMounted(true));
  }, []);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-[#1f1f1f] bg-[#0d0d0d] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-[#6b7280]">{endpoint.endpoint_id}</p>
          <h2 className="mt-2 break-all font-mono text-sm text-white">{endpoint.endpoint_url}</h2>
        </div>
        <button onClick={onClose} className="border border-[#1f1f1f] px-3 py-1 text-sm text-[#d1d5db]">
          Close
        </button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="border border-[#1f1f1f] bg-[#111111] p-3">
          <div className="text-xs text-[#6b7280]">Health</div>
          <div className="mt-2 font-mono text-xl text-white">{endpoint.avg_health_score}</div>
        </div>
        <div className="border border-[#1f1f1f] bg-[#111111] p-3">
          <div className="text-xs text-[#6b7280]">Events</div>
          <div className="mt-2 font-mono text-xl text-white">{endpoint.total_events}</div>
        </div>
        <div className="border border-[#1f1f1f] bg-[#111111] p-3">
          <div className="text-xs text-[#6b7280]">Failure</div>
          <div className="mt-2 font-mono text-xl text-[#ef4444]">{endpoint.failure_rate}%</div>
        </div>
      </div>
      <div className="mt-6 border border-[#1f1f1f] bg-[#111111] p-4">
        <h3 className="mb-4 text-sm text-white">Score Trend</h3>
        <div className="h-48">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={endpoint.score_trend}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #1f1f1f" }} />
                <Line type="monotone" dataKey="score" stroke="#00ff94" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="mt-6 max-h-[42vh] overflow-auto border border-[#1f1f1f]">
        {endpoint.event_history.slice().reverse().map((event) => (
          <div key={`${event.event_id}-${event.attempt_number}`} className="border-b border-[#1f1f1f] bg-[#111111] p-3 last:border-0">
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-xs text-white">{event.event_id}</div>
              <StatusCodeBadge code={event.status_code} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#6b7280]">
              <span>{formatDate(event.created_at)}</span>
              <HealthBar value={event.health_score} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
