"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { WebhookEvent } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function EventTable({ events }: { events: WebhookEvent[] }) {
  const [query, setQuery] = useState("");
  const [failureFilter, setFailureFilter] = useState("all");
  const [sortByConfidence, setSortByConfidence] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const failureOptions = useMemo(() => {
    const reasons = Array.from(
      new Set(
        events
          .map((event) => event.failureReason)
          .filter((reason) => reason && reason !== "-")
      )
    );
    return ["all", ...reasons];
  }, [events]);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    let result = events.filter((event) =>
      event.id.toLowerCase().includes(normalized)
    );
    if (failureFilter !== "all") {
      result = result.filter((event) =>
        event.failureReason.toLowerCase().includes(failureFilter.toLowerCase())
      );
    }
    if (sortByConfidence) {
      result = [...result].sort(
        (a, b) => b.replayConfidenceScore - a.replayConfidenceScore
      );
    }
    return result;
  }, [events, query, failureFilter, sortByConfidence]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search by event ID"
          className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 sm:w-64"
        />
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          {failureOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                setFailureFilter(option);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 ${
                failureFilter === option
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
          onClick={() => setSortByConfidence((value) => !value)}
        >
          Sort by replay confidence
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Event ID</th>
              <th className="py-2">Event Type</th>
              <th className="py-2">Endpoint ID</th>
              <th className="py-2">Delivery State</th>
              <th className="py-2">Failure Reason</th>
              <th className="py-2">Replay Confidence</th>
              <th className="py-2">Health Score</th>
              <th className="py-2">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((event) => (
              <tr key={event.id} className="border-t border-slate-800">
                <td className="py-3 font-mono text-xs text-slate-100">
                  <Link
                    href={`/events/${event.id}`}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    {event.id}
                  </Link>
                </td>
                <td className="py-3">{event.type}</td>
                <td className="py-3">{event.endpointId}</td>
                <td className="py-3">
                  <StatusBadge state={event.deliveryState} />
                </td>
                <td className="py-3 text-slate-400">{event.failureReason}</td>
                <td className="py-3 font-semibold text-blue-300">
                  {event.replayConfidenceScore}
                </td>
                <td className="py-3 font-semibold text-emerald-300">
                  {event.endpointHealthScore}
                </td>
                <td className="py-3 text-slate-200">
                  {event.recommendedAction}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-full border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="rounded-full border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
