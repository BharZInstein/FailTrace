"use client";

import { useEffect, useMemo, useState } from "react";
import { EndpointHealthChart, RetryPatternChart } from "@/components/DashboardCharts";
import ErrorBanner from "@/components/ErrorBanner";
import RecentEventsTable from "@/components/RecentEventsTable";
import { TableSkeleton } from "@/components/Skeleton";
import StatCard from "@/components/StatCard";
import { EndpointMonitor, FailTraceEvent, getEndpoints, getEvents } from "@/lib/failtrace-api";

export default function DashboardPage() {
  const [events, setEvents] = useState<FailTraceEvent[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [eventData, endpointData] = await Promise.all([getEvents(), getEndpoints()]);
        setEvents(eventData);
        setEndpoints(endpointData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total = events.length;
    const failed = events.filter((event) => event.status_code < 200 || event.status_code >= 300).length;
    const avgHealth = Math.round(
      events.reduce((sum, event) => sum + event.endpoint_health_score, 0) / Math.max(1, total)
    );
    const unsafe = events.filter((event) => !event.safe_to_replay && event.delivery_state !== "delivered").length;
    return { total, failed, avgHealth, unsafe };
  }, [events]);

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-[#00ff94]">Webhook operations</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Reliability Dashboard</h1>
      </div>

      {error && <ErrorBanner message={error} />}

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total Events" value={stats.total} trend="latest sampled events" />
        <StatCard label="Failed Deliveries" value={stats.failed} trend="non-2xx latest attempts" tone="danger" />
        <StatCard label="Avg Health Score" value={stats.avgHealth} trend="endpoint weighted" tone="safe" />
        <StatCard label="Unsafe Replays" value={stats.unsafe} trend="blocked by risk engine" tone="warn" />
      </section>

      {loading ? <TableSkeleton /> : <RecentEventsTable events={events} />}

      <section className="grid gap-5 lg:grid-cols-2">
        <RetryPatternChart events={events} />
        <EndpointHealthChart endpoints={endpoints} />
      </section>
    </div>
  );
}
