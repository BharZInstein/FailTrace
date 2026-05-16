"use client";

import { useParams } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import HealthGauge from "@/components/HealthGauge";
import LoadingState from "@/components/LoadingState";
import RecommendationPanel from "@/components/RecommendationPanel";
import RLDecisionCard from "@/components/RLDecisionCard";
import ReplayRiskGauge from "@/components/ReplayRiskGauge";
import RetryTimeline from "@/components/RetryTimeline";
import SectionHeader from "@/components/SectionHeader";
import StatusBadge from "@/components/StatusBadge";
import useApiData from "@/hooks/useApiData";
import { fetchEvent, fetchRecommendations, fetchRetryOptimization } from "@/services";

export default function EventDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const eventState = useApiData(() => fetchEvent(id ?? ""), [id]);
  const recommendationsState = useApiData(fetchRecommendations, []);
  const rlState = useApiData(fetchRetryOptimization, []);

  if (!id) {
    return <EmptyState label="No event selected." />;
  }

  if (eventState.isLoading) {
    return <LoadingState label="Loading event intelligence" />;
  }

  if (eventState.error) {
    return (
      <ErrorState
        label="Unable to load event detail."
        onRetry={eventState.refetch}
      />
    );
  }

  if (!eventState.data) {
    return <EmptyState label="Event details not available." />;
  }

  const event = eventState.data;

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Event Detail: ${event.id}`}
        subtitle="Full retry timeline, behavioral fingerprint, and replay guidance."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {event.type}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-100">
                {event.endpointId}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {event.timestamp}
              </p>
            </div>
            <StatusBadge state={event.deliveryState} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-400">Failure fingerprint</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {event.retryPattern.join(" → ")}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Primary reason: {event.failureReason}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-400">Endpoint health</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {event.endpointHealthScore}
              </p>
              <p className="mt-3 text-xs text-slate-400">Score out of 100</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-400">Replay confidence</p>
              <p className="mt-2 text-2xl font-semibold text-blue-300">
                {event.replayConfidenceScore}
              </p>
              <p className="mt-3 text-xs text-slate-400">Safety prediction</p>
            </div>
          </div>
          <div className="mt-6">
            <SectionHeader
              title="Delivery Attempt History"
              subtitle="Failure/success timeline with latency indicators."
            />
            <div className="mt-4">
              <RetryTimeline events={event.attempts} />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <SectionHeader title="Endpoint Health Score" />
            <HealthGauge value={event.endpointHealthScore} label="Health" />
            <ul className="mt-4 space-y-2 text-xs text-slate-400">
              {event.endpointHealthReasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <SectionHeader title="Replay Confidence Score" />
            <ReplayRiskGauge value={event.replayConfidenceScore} label="Safety" />
            <ul className="mt-4 space-y-2 text-xs text-slate-400">
              {event.replayConfidenceReasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
              <li>- Duplicate risk score: {event.duplicateRiskScore}%</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <SectionHeader title="Smart Recommendations" />
            {recommendationsState.isLoading ? (
              <LoadingState label="Loading recommendations" />
            ) : recommendationsState.error ? (
              <ErrorState
                label="Unable to load recommendations."
                onRetry={recommendationsState.refetch}
              />
            ) : recommendationsState.data &&
              recommendationsState.data.length > 0 ? (
              <RecommendationPanel items={recommendationsState.data} />
            ) : (
              <EmptyState label="No recommendations available." />
            )}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <SectionHeader title="Adaptive Retry Optimizer" />
            {rlState.isLoading ? (
              <LoadingState label="Loading optimization layer" />
            ) : rlState.error ? (
              <ErrorState
                label="Unable to load optimization layer."
                onRetry={rlState.refetch}
              />
            ) : rlState.data && rlState.data.decisions.length > 0 ? (
              <RLDecisionCard decision={rlState.data.decisions[0]} />
            ) : (
              <EmptyState label="No optimization guidance." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
