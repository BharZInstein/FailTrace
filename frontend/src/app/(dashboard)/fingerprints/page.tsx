"use client";

import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import FingerprintCard from "@/components/FingerprintCard";
import LoadingState from "@/components/LoadingState";
import SectionHeader from "@/components/SectionHeader";
import useApiData from "@/hooks/useApiData";
import { fetchFingerprints } from "@/services";

export default function FingerprintsPage() {
  const { data, isLoading, error, refetch } = useApiData(fetchFingerprints, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Failure Fingerprinting Dashboard"
        subtitle="Behavioral clusters, dominant failure causes, and replay safety."
      />
      {isLoading ? (
        <LoadingState label="Loading failure fingerprints" />
      ) : error ? (
        <ErrorState label="Unable to load fingerprints." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {data.map((fingerprint) => (
            <FingerprintCard key={fingerprint.id} fingerprint={fingerprint} />
          ))}
        </div>
      ) : (
        <EmptyState label="No fingerprints detected." />
      )}
    </div>
  );
}
