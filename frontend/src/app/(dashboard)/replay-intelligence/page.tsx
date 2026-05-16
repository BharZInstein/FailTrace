"use client";

import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import RecommendationPanel from "@/components/RecommendationPanel";
import ReplayConfidenceChart from "@/components/ReplayConfidenceChart";
import ReplayRiskGauge from "@/components/ReplayRiskGauge";
import SectionHeader from "@/components/SectionHeader";
import useApiData from "@/hooks/useApiData";
import { fetchReplayBundle } from "@/services";

export default function ReplayIntelligencePage() {
  const { data, isLoading, error, refetch } = useApiData(fetchReplayBundle, []);

  if (isLoading) {
    return <LoadingState label="Loading replay intelligence" />;
  }

  if (error) {
    return (
      <ErrorState label="Unable to load replay intelligence." onRetry={refetch} />
    );
  }

  if (!data) {
    return <EmptyState label="No replay intelligence available." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Replay Intelligence Dashboard"
        subtitle="Replay confidence, duplicate risk, and safety distribution aligned to event-level scoring."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader title="Replay Confidence Score" />
          <ReplayRiskGauge value={data.analysis.confidenceScore} label="Safe Replay" />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader title="Duplicate Risk" />
          <ReplayRiskGauge value={data.analysis.duplicateRiskScore} label="Risk" />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader title="Unsafe Replay" />
          <ReplayRiskGauge value={data.analysis.unsafeScore} label="Unsafe" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader
            title="Replay Confidence Distribution"
            subtitle="Safe vs unsafe replay confidence bands."
          />
          <ReplayConfidenceChart
            data={data.analysis.confidenceDistribution}
          />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <SectionHeader
            title="Duplicate Replay Risk"
            subtitle="Density of duplicate risk by replay confidence band."
          />
          <ReplayConfidenceChart
            data={data.analysis.duplicateRiskDistribution}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <SectionHeader
          title="Replay Recommendations"
          subtitle="Explainable guidance tied to replay confidence and duplicate risk."
        />
        {data.recommendations.length > 0 ? (
          <RecommendationPanel items={data.recommendations} />
        ) : (
          <EmptyState label="No replay recommendations available." />
        )}
      </div>
    </div>
  );
}
