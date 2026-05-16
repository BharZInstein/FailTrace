"use client";

import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import RLDecisionCard from "@/components/RLDecisionCard";
import RetryOptimizationChart from "@/components/RetryOptimizationChart";
import SectionHeader from "@/components/SectionHeader";
import useApiData from "@/hooks/useApiData";
import { fetchRetryOptimization } from "@/services";

export default function RLOptimizationPage() {
  const { data, isLoading, error, refetch } = useApiData(
    fetchRetryOptimization,
    []
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Adaptive Retry Optimizer"
        subtitle="Adaptive retry strategies informed by historical replay outcomes."
      />
      {isLoading ? (
        <LoadingState label="Loading optimization signals" />
      ) : error ? (
        <ErrorState label="Unable to load optimization layer." onRetry={refetch} />
      ) : data ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {data.decisions.map((decision) => (
              <RLDecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <SectionHeader
              title="Optimization Confidence Trend"
              subtitle="Reward trajectory and replay success improvement."
            />
            <RetryOptimizationChart data={data.rewardTrend} />
          </div>
        </>
      ) : (
        <EmptyState label="No optimization data available." />
      )}
    </div>
  );
}
