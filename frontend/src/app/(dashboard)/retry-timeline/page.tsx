"use client";

import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import RetryTimeline from "@/components/RetryTimeline";
import SectionHeader from "@/components/SectionHeader";
import useApiData from "@/hooks/useApiData";
import { fetchEvents } from "@/services";

export default function RetryTimelinePage() {
  const { data, isLoading, error, refetch } = useApiData(fetchEvents, []);
  const timeline = data?.[0]?.attempts ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Retry Timeline Visualization"
        subtitle="Hover-ready timeline of retry intervals and status transitions."
      />
      {isLoading ? (
        <LoadingState label="Loading retry timeline" />
      ) : error ? (
        <ErrorState label="Unable to load retry timeline." onRetry={refetch} />
      ) : timeline.length > 0 ? (
        <RetryTimeline events={timeline} />
      ) : (
        <EmptyState label="No retry timeline data available." />
      )}
    </div>
  );
}
