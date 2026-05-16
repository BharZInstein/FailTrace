"use client";

import EmptyState from "@/components/EmptyState";
import EndpointHealthChart from "@/components/EndpointHealthChart";
import ErrorState from "@/components/ErrorState";
import HealthGauge from "@/components/HealthGauge";
import LoadingState from "@/components/LoadingState";
import SectionHeader from "@/components/SectionHeader";
import useApiData from "@/hooks/useApiData";
import { fetchEndpoints } from "@/services";

export default function EndpointsPage() {
  const { data, isLoading, error, refetch } = useApiData(fetchEndpoints, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Endpoint Health Monitoring"
        subtitle="Reliability scoring, latency, and timeout frequency per endpoint."
      />
      {isLoading ? (
        <LoadingState label="Loading endpoint health" />
      ) : error ? (
        <ErrorState label="Unable to load endpoints." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {data.map((endpoint) => (
            <div
              key={endpoint.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {endpoint.id}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-100">
                    {endpoint.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {endpoint.status}
                  </p>
                </div>
                <HealthGauge value={endpoint.score} label="Score" />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Success rate</span>
                  <span className="font-semibold">{endpoint.successRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Failure streak</span>
                  <span className="font-semibold">{endpoint.failureStreak}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg latency</span>
                  <span className="font-semibold">{endpoint.avgLatency} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Timeout frequency</span>
                  <span className="font-semibold">
                    {endpoint.timeoutFrequency}%
                  </span>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-400">
                {endpoint.reasons.map((reason) => (
                  <li key={reason}>- {reason}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState label="No endpoint health data available." />
      )}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <SectionHeader
          title="Endpoint Health Trend"
          subtitle="Score movement across top integrations."
        />
        {data && data.length > 0 ? (
          <EndpointHealthChart
            data={data.map((endpoint) => ({
              name: endpoint.name,
              score: endpoint.score,
            }))}
          />
        ) : (
          <EmptyState label="No trend data available." />
        )}
      </div>
    </div>
  );
}
