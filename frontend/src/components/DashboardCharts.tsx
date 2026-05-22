"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EndpointMonitor, FailTraceEvent } from "@/lib/failtrace-api";

const tooltipStyle = {
  background: "#111111",
  border: "1px solid #1f1f1f",
  color: "#fff",
};

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    void Promise.resolve().then(() => setMounted(true));
  }, []);
  return mounted;
}

export function RetryPatternChart({ events }: { events: FailTraceEvent[] }) {
  const mounted = useMounted();
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    const key = String(event.retry_count);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([retry_count, events]) => ({
    retry_count: `${retry_count} retries`,
    events,
  }));

  return (
    <section className="border border-[#1f1f1f] bg-[#111111] p-4">
      <h2 className="mb-4 text-sm font-medium text-white">Retry Count Distribution</h2>
      <div className="h-72">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="retry_count" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#151515" }} />
              <Bar dataKey="events" fill="#00ff94" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export function EndpointHealthChart({ endpoints }: { endpoints: EndpointMonitor[] }) {
  const mounted = useMounted();
  const data = endpoints
    .slice()
    .sort((a, b) => a.avg_health_score - b.avg_health_score)
    .map((endpoint) => ({
      endpoint: endpoint.endpoint_url.split("/").filter(Boolean).at(-1) ?? endpoint.endpoint_id,
      score: endpoint.avg_health_score,
    }));

  return (
    <section className="border border-[#1f1f1f] bg-[#111111] p-4">
      <h2 className="mb-4 text-sm font-medium text-white">Endpoint Health</h2>
      <div className="h-72">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke="#1f1f1f" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="endpoint" type="category" stroke="#6b7280" fontSize={12} width={110} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#151515" }} />
              <Bar dataKey="score" fill="#00ff94" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
