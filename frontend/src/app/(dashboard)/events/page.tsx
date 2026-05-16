"use client";

import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import EventTable from "@/components/EventTable";
import LoadingState from "@/components/LoadingState";
import SectionHeader from "@/components/SectionHeader";
import useApiData from "@/hooks/useApiData";
import { fetchEvents } from "@/services";

export default function EventsPage() {
  const { data, isLoading, error, refetch } = useApiData(fetchEvents, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Event Explorer"
        subtitle="Search, filter, and prioritize webhook events by replay risk."
      />
      {isLoading ? (
        <LoadingState label="Loading event stream" />
      ) : error ? (
        <ErrorState label="Unable to load events." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <EventTable events={data} />
      ) : (
        <EmptyState label="No webhook events available." />
      )}
    </div>
  );
}
