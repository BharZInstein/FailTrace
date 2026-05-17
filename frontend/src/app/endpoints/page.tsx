"use client";

import { useEffect, useState } from "react";
import EndpointDrawer from "@/components/EndpointDrawer";
import ErrorBanner from "@/components/ErrorBanner";
import HealthBar from "@/components/HealthBar";
import { TableSkeleton } from "@/components/Skeleton";
import { EndpointMonitor, formatDate, getEndpoints } from "@/lib/failtrace-api";

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<EndpointMonitor[]>([]);
  const [selected, setSelected] = useState<EndpointMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setEndpoints(await getEndpoints());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load endpoints");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-[#00ff94]">Endpoint telemetry</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Endpoint Monitor</h1>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-hidden border border-[#1f1f1f] bg-[#111111]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#1f1f1f] text-xs uppercase text-[#6b7280]">
              <tr>
                <th className="px-4 py-2">Endpoint URL</th>
                <th className="px-4 py-2">Avg Health</th>
                <th className="px-4 py-2">Total Events</th>
                <th className="px-4 py-2">Failure Rate</th>
                <th className="px-4 py-2">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr
                  key={endpoint.endpoint_id}
                  onClick={() => setSelected(endpoint)}
                  className="cursor-pointer border-b border-[#1a1a1a] text-[#d1d5db] transition hover:bg-[#151515]"
                >
                  <td className="px-4 py-3 font-mono text-xs text-white">{endpoint.endpoint_url}</td>
                  <td className="px-4 py-3">
                    <HealthBar value={endpoint.avg_health_score} />
                  </td>
                  <td className="px-4 py-3 font-mono">{endpoint.total_events}</td>
                  <td className="px-4 py-3 font-mono text-[#ef4444]">{endpoint.failure_rate}%</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{formatDate(endpoint.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <EndpointDrawer endpoint={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
