"use client";

import DeliveryDistributionChart from "@/components/DeliveryDistributionChart";
import EmptyState from "@/components/EmptyState";
import EndpointHealthChart from "@/components/EndpointHealthChart";
import ErrorState from "@/components/ErrorState";
import FailureTrendChart from "@/components/FailureTrendChart";
import LoadingState from "@/components/LoadingState";
import MetricCard from "@/components/MetricCard";
import ReplayConfidenceChart from "@/components/ReplayConfidenceChart";
import RetryPatternChart from "@/components/RetryPatternChart";
import SectionHeader from "@/components/SectionHeader";
import useApiData from "@/hooks/useApiData";
import { fetchOverview } from "@/services";

export default function OverviewPage() {
  const { data, isLoading, error, refetch } = useApiData(fetchOverview, []);

  if (isLoading) {
    return <LoadingState label="Loading overview metrics" />;
  }

  if (error) {
    return (
      <ErrorState
        label="Unable to load overview signals."
        onRetry={refetch}
      />
    );
  }

  if (!data) {
    return <EmptyState label="No overview data available." />;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Overview Dashboard"
        subtitle="Live reliability, replay safety, and endpoint health signals."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader
            title="Delivery State Distribution"
            subtitle="Delivered, failed, recovered, and queued breakdown."
          />
          {data.deliveryDistribution.length > 0 ? (
            <DeliveryDistributionChart data={data.deliveryDistribution} />
          ) : (
            <EmptyState label="No delivery distribution data." />
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader
            title="Failure Trend Graph"
            subtitle="Failure and recovery volume over the last 24h."
          />
          {data.failureTrend.length > 0 ? (
            <FailureTrendChart data={data.failureTrend} />
          ) : (
            <EmptyState label="No failure trend data." />
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 lg:col-span-2">
          <SectionHeader
            title="Endpoint Health Overview"
            subtitle="Reliability scores for critical endpoints."
          />
          {data.endpointHealthOverview.length > 0 ? (
            <EndpointHealthChart data={data.endpointHealthOverview} />
          ) : (
            <EmptyState label="No endpoint health overview." />
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader
            title="Replay Confidence Distribution"
            subtitle="Safe vs unsafe replay likelihood."
          />
          {data.replayConfidenceDistribution.length > 0 ? (
            <ReplayConfidenceChart data={data.replayConfidenceDistribution} />
          ) : (
            <EmptyState label="No replay confidence distribution." />
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <SectionHeader
          title="Retry Pattern Statistics"
          subtitle="Dominant failure fingerprints and grouped retry sequences."
        />
        {data.retryPatternStats.length > 0 ? (
          <RetryPatternChart data={data.retryPatternStats} />
        ) : (
          <EmptyState label="No retry pattern statistics." />
        )}
      </div>
    </div>
  );
}
