import {
  EndpointHealth,
  EndpointHealthResponse,
  FailureFingerprint,
  FailureFingerprintResponse,
  Metric,
  MetricResponse,
  OverviewResponse,
  OverviewView,
  ReplayAnalysis,
  ReplayAnalysisResponse,
  RetryOptimization,
  RetryOptimizationResponse,
  WebhookEvent,
  WebhookEventResponse,
} from "@/lib/types";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatMetricValue = (value: number, unit?: string) => {
  if (unit === "%") {
    return `${value.toFixed(1)}%`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return numberFormatter.format(value);
};

const formatChangeValue = (value: number, unit?: string) => {
  const sign = value > 0 ? "+" : "";
  if (unit === "%") {
    return `${sign}${value.toFixed(1)}%`;
  }
  return `${sign}${value.toFixed(1)}%`;
};

export const mapMetrics = (metrics: MetricResponse[]): Metric[] =>
  metrics.map((metric) => ({
    title: metric.title,
    value: formatMetricValue(metric.value, metric.unit),
    change: formatChangeValue(metric.change, metric.unit),
    trend: metric.trend,
    tone: metric.tone,
  }));

export const mapWebhookEvent = (event: WebhookEventResponse): WebhookEvent => ({
  id: event.id,
  type: event.type,
  endpointId: event.endpoint_id,
  deliveryState: event.delivery_state,
  failureReason: event.failure_reason,
  replayConfidenceScore: event.replay_confidence.score,
  replayConfidenceReasons: event.replay_confidence.reasons,
  duplicateRiskScore: event.replay_confidence.duplicate_risk,
  endpointHealthScore: event.endpoint_health.score,
  endpointHealthReasons: event.endpoint_health.reasons,
  recommendedAction: event.recommended_action,
  timestamp: event.timestamp,
  retryPattern: event.retry_pattern,
  attempts: event.attempts.map((attempt) => ({
    time: attempt.time,
    status: attempt.status,
    latencyMs: attempt.latency_ms,
  })),
});

export const mapWebhookEvents = (events: WebhookEventResponse[]) =>
  events.map(mapWebhookEvent);

export const mapEndpointHealth = (
  endpoints: EndpointHealthResponse[]
): EndpointHealth[] =>
  endpoints.map((endpoint) => ({
    id: endpoint.endpoint_id,
    name: endpoint.name,
    score: endpoint.score,
    successRate: endpoint.success_rate,
    failureStreak: endpoint.failure_streak,
    avgLatency: endpoint.avg_latency_ms,
    timeoutFrequency: endpoint.timeout_frequency,
    status: endpoint.status,
    reasons: endpoint.reasons,
  }));

export const mapFingerprints = (
  fingerprints: FailureFingerprintResponse[]
): FailureFingerprint[] =>
  fingerprints.map((fingerprint) => ({
    id: fingerprint.id,
    label: fingerprint.label,
    sequence: fingerprint.sequence,
    recoveryRate: fingerprint.recovery_rate,
    avgRetries: fingerprint.avg_retries,
    dominantCause: fingerprint.dominant_cause,
    replaySafety: fingerprint.replay_safety,
    action: fingerprint.action,
  }));

export const mapReplayAnalysis = (
  response: ReplayAnalysisResponse
): ReplayAnalysis => ({
  confidenceScore: response.confidence_score,
  duplicateRiskScore: response.duplicate_risk_score,
  unsafeScore: response.unsafe_score,
  confidenceDistribution: response.confidence_distribution,
  duplicateRiskDistribution: response.duplicate_risk_distribution,
});

export const mapRetryOptimization = (
  response: RetryOptimizationResponse
): RetryOptimization => ({
  decisions: response.decisions.map((decision) => ({
    id: decision.id,
    action: decision.action,
    confidence: decision.confidence,
    insight: decision.insight,
    outcomeLift: decision.outcome_lift,
  })),
  rewardTrend: response.reward_trend.map((item) => ({
    cycle: item.cycle,
    reward: item.reward,
    successLift: item.success_lift,
  })),
});

const buildFailureTrend = (events: WebhookEvent[]) => {
  const bucket: Record<string, { failed: number; recovered: number }> = {};
  events.forEach((event) => {
    const hour = event.timestamp.split(" ")[1]?.slice(0, 2) ?? "00";
    const key = `${hour}:00`;
    if (!bucket[key]) {
      bucket[key] = { failed: 0, recovered: 0 };
    }
    if (event.deliveryState === "Failed") {
      bucket[key].failed += 1;
    }
    if (event.deliveryState === "Recovered") {
      bucket[key].recovered += 1;
    }
  });
  return Object.entries(bucket).map(([time, values]) => ({
    time,
    failed: values.failed,
    recovered: values.recovered,
  }));
};

const buildDeliveryDistribution = (events: WebhookEvent[]) => {
  const counts: Record<string, number> = {
    Delivered: 0,
    Failed: 0,
    Recovered: 0,
    Queued: 0,
  };
  events.forEach((event) => {
    counts[event.deliveryState] += 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const buildRetryPatternStats = (events: WebhookEvent[]) => {
  const counts: Record<string, number> = {};
  events.forEach((event) => {
    const key = event.retryPattern.join(" → ");
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts).map(([pattern, count]) => ({ pattern, count }));
};

const buildMetrics = (events: WebhookEvent[], endpoints: EndpointHealth[]) => {
  const total = events.length || 1;
  const delivered = events.filter(
    (event) => event.deliveryState === "Delivered"
  ).length;
  const failed = events.filter((event) => event.deliveryState === "Failed")
    .length;
  const recovered = events.filter(
    (event) => event.deliveryState === "Recovered"
  ).length;
  const replaySafe = events.filter(
    (event) => event.replayConfidenceScore >= 70
  ).length;
  const criticalEndpoints = endpoints.filter(
    (endpoint) => endpoint.status === "Critical"
  ).length;

  return mapMetrics([
    {
      key: "total_events",
      title: "Total Events",
      value: total,
      change: 0,
      trend: "flat",
      tone: "info",
    },
    {
      key: "delivered_rate",
      title: "Delivered %",
      value: (delivered / total) * 100,
      unit: "%",
      change: 0,
      trend: "flat",
      tone: "success",
    },
    {
      key: "failed_rate",
      title: "Failed %",
      value: (failed / total) * 100,
      unit: "%",
      change: 0,
      trend: "flat",
      tone: "warning",
    },
    {
      key: "recovered_rate",
      title: "Recovered %",
      value: (recovered / total) * 100,
      unit: "%",
      change: 0,
      trend: "flat",
      tone: "success",
    },
    {
      key: "replay_safe",
      title: "Replay Safe %",
      value: (replaySafe / total) * 100,
      unit: "%",
      change: 0,
      trend: "flat",
      tone: "info",
    },
    {
      key: "critical_endpoints",
      title: "Critical Endpoints",
      value: criticalEndpoints,
      change: 0,
      trend: "flat",
      tone: "danger",
    },
  ]);
};

export const buildOverviewView = (
  overview: OverviewResponse,
  events: WebhookEvent[],
  replay: ReplayAnalysis,
  endpoints: EndpointHealth[]
): OverviewView => ({
  metrics: overview.metrics.length
    ? mapMetrics(overview.metrics)
    : buildMetrics(events, endpoints),
  deliveryDistribution: overview.delivery_distribution.length
    ? overview.delivery_distribution
    : buildDeliveryDistribution(events),
  failureTrend: overview.failure_trend.length
    ? overview.failure_trend
    : buildFailureTrend(events),
  endpointHealthOverview: overview.endpoint_health_overview.length
    ? overview.endpoint_health_overview
    : endpoints.map((endpoint) => ({
        name: endpoint.name,
        score: endpoint.score,
      })),
  replayConfidenceDistribution: replay.confidenceDistribution.length
    ? replay.confidenceDistribution
    : overview.replay_confidence_distribution,
  retryPatternStats: overview.retry_pattern_stats.length
    ? overview.retry_pattern_stats
    : buildRetryPatternStats(events),
});
