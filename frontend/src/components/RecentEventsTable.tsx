"use client";

import HealthBar from "./HealthBar";
import StatusBadge, { StatusCodeBadge } from "./StatusBadge";
import { FailTraceEvent, formatDate } from "@/lib/failtrace-api";

export default function RecentEventsTable({ events }: { events: FailTraceEvent[] }) {
  return (
    <div className="overflow-hidden border border-[#1f1f1f] bg-[#111111]">
      <div className="border-b border-[#1f1f1f] px-4 py-3">
        <h2 className="text-sm font-medium text-white">Recent Events</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#1f1f1f] text-xs uppercase text-[#6b7280]">
            <tr>
              <th className="px-4 py-2">Event ID</th>
              <th className="px-4 py-2">Endpoint URL</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Retries</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Health</th>
              <th className="px-4 py-2">Seen</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.event_id} className="border-b border-[#1a1a1a] text-[#d1d5db] last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-white">{event.event_id}</td>
                <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-[#6b7280]">
                  {event.endpoint_url}
                </td>
                <td className="px-4 py-3">
                  <StatusCodeBadge code={event.status_code} />
                </td>
                <td className="px-4 py-3 font-mono">{event.retry_count}</td>
                <td className="px-4 py-3">
                  <StatusBadge state={event.delivery_state} />
                </td>
                <td className="px-4 py-3 text-xs text-white">{event.recommended_action}</td>
                <td className="px-4 py-3">
                  <HealthBar value={event.endpoint_health_score} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{formatDate(event.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
