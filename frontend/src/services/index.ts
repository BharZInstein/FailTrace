import apiClient from "./apiClient";
import {
  buildOverviewView,
  mapEndpointHealth,
  mapFingerprints,
  mapReplayAnalysis,
  mapRetryOptimization,
  mapWebhookEvent,
  mapWebhookEvents,
} from "./adapters";
import { mockApi } from "./mock";
import {
  EndpointHealth,
  EndpointHealthResponse,
  FailureFingerprint,
  FailureFingerprintResponse,
  OverviewResponse,
  OverviewView,
  Recommendation,
  ReplayAnalysis,
  ReplayAnalysisResponse,
  RetryOptimization,
  RetryOptimizationResponse,
  WebhookEvent,
  WebhookEventResponse,
} from "@/lib/types";

type BackendDecision = {
  event_id: string;
  endpoint_id: string;
  delivery_state: string;
  failure_reason: string;
  safe_to_replay: boolean;
  recommended_action: string;
  endpoint_health_score: number;
  replay_confidence_score: number;
  explanation: string[];
  features: {
    retry_count?: number;
    timeout_frequency?: number;
    average_response_time_ms?: number;
    endpoint_success_rate?: number;
    replay_frequency?: number;
    payload_size_kb?: number;
    signature_mismatch_frequency?: number;
    endpoint_activity_status?: string;
  };
};

type BackendAttempt = {
  event_id: string;
  endpoint_id: string;
  attempt_number: number;
  status_code: number;
  response_time_ms: number;
  created_at: string;
};

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const get = async <T>(path: string) => {
  const response = await apiClient.get<T>(path);
  return response.data;
};

const titleCase = (value: string) =>
  value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

const formatTimestamp = (value?: string) => {
  if (!value || value === "manual") {
    return "Manual input";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ").slice(0, 19);
  }
  return date.toISOString().replace("T", " ").slice(0, 19);
};

const toDeliveryState = (state: string): WebhookEventResponse["delivery_state"] => {
  if (state === "delivered") return "Delivered";
  if (state === "recovered") return "Recovered";
  if (state === "retrying") return "Queued";
  return "Failed";
};

const inferEventType = (endpointId: string) => {
  if (endpointId.includes("billing")) return "invoice.paid";
  if (endpointId.includes("crm")) return "customer.updated";
  if (endpointId.includes("erp")) return "inventory.updated";
  if (endpointId.includes("rate")) return "payment.failed";
  return "webhook.event";
};

const buildRetryPattern = (attempts: BackendAttempt[], fallbackReason: string) => {
  if (!attempts.length) {
    return [fallbackReason === "none" ? "200" : fallbackReason];
  }
  return attempts
    .sort((a, b) => a.attempt_number - b.attempt_number)
    .map((attempt) => String(attempt.status_code));
};

const mapDecisionToEvent = (
  decision: BackendDecision,
  attempts: BackendAttempt[]
): WebhookEventResponse => {
  const eventAttempts = attempts.filter(
    (attempt) => attempt.event_id === decision.event_id
  );
  const latestAttempt = eventAttempts.at(-1);
  const duplicateRisk = decision.safe_to_replay
    ? Math.max(0, 100 - decision.replay_confidence_score)
    : Math.min(100, 100 - decision.replay_confidence_score + 20);

  return {
    id: decision.event_id,
    type: inferEventType(decision.endpoint_id),
    endpoint_id: decision.endpoint_id,
    delivery_state: toDeliveryState(decision.delivery_state),
    failure_reason:
      decision.failure_reason === "none" ? "-" : titleCase(decision.failure_reason),
    replay_confidence: {
      score: decision.replay_confidence_score,
      reasons: decision.explanation,
      duplicate_risk: duplicateRisk,
    },
    endpoint_health: {
      score: decision.endpoint_health_score,
      reasons: [
        `Success rate: ${Math.round((decision.features.endpoint_success_rate ?? 0) * 100)}%`,
        `Avg latency: ${Math.round(decision.features.average_response_time_ms ?? 0)}ms`,
      ],
    },
    recommended_action: decision.recommended_action,
    timestamp: formatTimestamp(latestAttempt?.created_at),
    retry_pattern: buildRetryPattern(eventAttempts, decision.failure_reason),
    attempts: eventAttempts.map((attempt) => ({
      time: formatTimestamp(attempt.created_at).slice(11, 16),
      status: String(attempt.status_code),
      latency_ms: attempt.response_time_ms,
    })),
  };
};

const fetchBackendBundle = async () => {
  const [decisions, attempts] = await Promise.all([
    get<BackendDecision[]>("/decisions?limit=250"),
    get<BackendAttempt[]>("/attempts?limit=500"),
  ]);
  return { decisions, attempts };
};

const buildEndpointResponses = (
  decisions: BackendDecision[],
  attempts: BackendAttempt[]
): EndpointHealthResponse[] => {
  const endpointIds = Array.from(
    new Set(decisions.map((decision) => decision.endpoint_id))
  );

  return endpointIds.map((endpointId) => {
    const endpointDecisions = decisions.filter(
      (decision) => decision.endpoint_id === endpointId
    );
    const endpointAttempts = attempts.filter(
      (attempt) => attempt.endpoint_id === endpointId
    );
    const latest = endpointDecisions.at(-1);
    const score = Math.round(
      endpointDecisions.reduce(
        (sum, decision) => sum + decision.endpoint_health_score,
        0
      ) / Math.max(1, endpointDecisions.length)
    );
    const successCount = endpointAttempts.filter(
      (attempt) => attempt.status_code >= 200 && attempt.status_code < 300
    ).length;
    const timeoutCount = endpointAttempts.filter(
      (attempt) =>
        attempt.status_code === 408 ||
        attempt.status_code === 504 ||
        attempt.response_time_ms >= 8000
    ).length;
    const failedTail = [...endpointAttempts]
      .reverse()
      .findIndex((attempt) => attempt.status_code >= 200 && attempt.status_code < 300);
    const failureStreak = failedTail === -1 ? endpointAttempts.length : failedTail;

    return {
      endpoint_id: endpointId,
      name: titleCase(endpointId.replace(/^ep_/, "")),
      score,
      success_rate: Math.round((successCount / Math.max(1, endpointAttempts.length)) * 1000) / 10,
      failure_streak: failureStreak,
      avg_latency_ms: Math.round(
        endpointAttempts.reduce((sum, attempt) => sum + attempt.response_time_ms, 0) /
          Math.max(1, endpointAttempts.length)
      ),
      timeout_frequency:
        Math.round((timeoutCount / Math.max(1, endpointAttempts.length)) * 1000) / 10,
      status: score >= 75 ? "Healthy" : score >= 45 ? "Unstable" : "Critical",
      reasons: latest?.explanation ?? ["No decision history available"],
    };
  });
};

const buildReplayAnalysisResponse = (
  decisions: BackendDecision[]
): ReplayAnalysisResponse => {
  const total = Math.max(1, decisions.length);
  const safe = decisions.filter((decision) => decision.safe_to_replay).length;
  const unsafe = decisions.filter(
    (decision) =>
      !decision.safe_to_replay && decision.replay_confidence_score < 45
  ).length;
  const duplicateRisk = decisions.filter(
    (decision) => decision.failure_reason === "duplicate_event"
  ).length;

  const bandCount = (min: number, max: number) =>
    decisions.filter(
      (decision) =>
        decision.replay_confidence_score >= min &&
        decision.replay_confidence_score <= max
    ).length;

  return {
    confidence_score: Math.round(
      decisions.reduce((sum, decision) => sum + decision.replay_confidence_score, 0) /
        total
    ),
    duplicate_risk_score: Math.round((duplicateRisk / total) * 100),
    unsafe_score: Math.round((unsafe / total) * 100),
    confidence_distribution: [
      { band: "Safe", value: safe },
      { band: "Duplicate Risk", value: duplicateRisk },
      { band: "Unsafe", value: unsafe },
    ],
    duplicate_risk_distribution: [
      { band: "0-20", value: bandCount(0, 20) },
      { band: "21-40", value: bandCount(21, 40) },
      { band: "41-60", value: bandCount(41, 60) },
      { band: "61-80", value: bandCount(61, 80) },
      { band: "81-100", value: bandCount(81, 100) },
    ],
  };
};

export const fetchEvents = async (): Promise<WebhookEvent[]> => {
  if (useMock) {
    const data = await mockApi.getEvents();
    return mapWebhookEvents(data);
  }
  const { decisions, attempts } = await fetchBackendBundle();
  return mapWebhookEvents(
    decisions.map((decision) => mapDecisionToEvent(decision, attempts))
  );
};

export const fetchEvent = async (id: string): Promise<WebhookEvent> => {
  if (useMock) {
    const data = await mockApi.getEvent(id);
    return mapWebhookEvent(data);
  }
  const events = await fetchEvents();
  const event = events.find((item) => item.id === id);
  if (!event) {
    throw new Error(`Event ${id} not found`);
  }
  return event;
};

export const fetchEndpoints = async (): Promise<EndpointHealth[]> => {
  if (useMock) {
    const data = await mockApi.getHealth();
    return mapEndpointHealth(data);
  }
  const { decisions, attempts } = await fetchBackendBundle();
  return mapEndpointHealth(buildEndpointResponses(decisions, attempts));
};

export const fetchFingerprints = async (): Promise<FailureFingerprint[]> => {
  if (useMock) {
    const data = await mockApi.getFingerprints();
    return mapFingerprints(data);
  }
  const events = await fetchEvents();
  const grouped = new Map<string, WebhookEvent[]>();
  events.forEach((event) => {
    const key = event.retryPattern.join(" → ");
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  });

  const fingerprints: FailureFingerprintResponse[] = Array.from(grouped.entries())
    .slice(0, 8)
    .map(([sequence, group], index) => {
      const recovered = group.filter((event) => event.deliveryState === "Recovered").length;
      const avgRetries =
        group.reduce((sum, event) => sum + Math.max(0, event.attempts.length - 1), 0) /
        Math.max(1, group.length);
      return {
        id: `fp_${index + 1}`,
        label: sequence.includes("429")
          ? "RATE_LIMIT_CLUSTER"
          : sequence.includes("401") || sequence.includes("403")
            ? "SIGNATURE_CLUSTER"
            : sequence.includes("504") || sequence.includes("408")
              ? "TIMEOUT_CLUSTER"
              : "DELIVERY_PATTERN",
        sequence,
        recovery_rate: Math.round((recovered / Math.max(1, group.length)) * 100),
        avg_retries: Math.round(avgRetries * 10) / 10,
        dominant_cause: group[0]?.failureReason ?? "-",
        replay_safety: Math.round(
          group.reduce((sum, event) => sum + event.replayConfidenceScore, 0) /
            Math.max(1, group.length)
        ),
        action: group[0]?.recommendedAction ?? "Review manually",
      };
    });

  return mapFingerprints(fingerprints);
};

export const fetchReplayAnalysis = async (): Promise<ReplayAnalysis> => {
  if (useMock) {
    const data = await mockApi.getReplayAnalysis();
    return mapReplayAnalysis(data);
  }
  const decisions = await get<BackendDecision[]>("/decisions?limit=250");
  return mapReplayAnalysis(buildReplayAnalysisResponse(decisions));
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  if (useMock) {
    return mockApi.getRecommendations();
  }
  const decisions = await get<BackendDecision[]>("/decisions?limit=250");
  const actions = Array.from(
    new Set(
      decisions
        .filter((decision) => decision.recommended_action !== "No Action")
        .map((decision) => decision.recommended_action)
    )
  );
  return actions.slice(0, 5).map((action, index) => ({
    id: `rec_${index + 1}`,
    title: action,
    detail:
      decisions.find((decision) => decision.recommended_action === action)
        ?.explanation.join(" ") ?? "Review this webhook pattern before replay.",
    severity:
      action.includes("Stop") || action.includes("Check")
        ? "danger"
        : action.includes("Verify")
          ? "warning"
          : "info",
  }));
};

export const fetchRetryOptimization = async (): Promise<RetryOptimization> => {
  if (useMock) {
    const data = await mockApi.getRetryOptimizer();
    return mapRetryOptimization(data);
  }
  const decisions = await get<BackendDecision[]>("/decisions?limit=250");
  const response: RetryOptimizationResponse = {
    decisions: [
      {
        id: "rule_retry_now",
        action: "Retry Now",
        confidence: Math.round(
          decisions
            .filter((decision) => decision.recommended_action === "Retry Now")
            .reduce((sum, decision) => sum + decision.replay_confidence_score, 0) /
            Math.max(
              1,
              decisions.filter((decision) => decision.recommended_action === "Retry Now").length
            )
        ),
        insight: "Current rule layer marks these attempts as replayable.",
        outcome_lift: 8,
      },
      {
        id: "rule_delay_retry",
        action: "Delay Retry",
        confidence: 72,
        insight: "Timeouts and rate limits should wait for endpoint recovery.",
        outcome_lift: 6,
      },
      {
        id: "rule_stop_retry",
        action: "Stop Retry",
        confidence: 64,
        insight: "Unsafe replay patterns require operator verification.",
        outcome_lift: 4,
      },
    ],
    reward_trend: [
      { cycle: "1", reward: 18, success_lift: 4 },
      { cycle: "2", reward: 24, success_lift: 6 },
      { cycle: "3", reward: 29, success_lift: 8 },
      { cycle: "4", reward: 33, success_lift: 9 },
    ],
  };
  return mapRetryOptimization(response);
};

export const fetchOverview = async (): Promise<OverviewView> => {
  const emptyOverview: OverviewResponse = {
    metrics: [],
    delivery_distribution: [],
    failure_trend: [],
    endpoint_health_overview: [],
    replay_confidence_distribution: [],
    retry_pattern_stats: [],
  };
  const [events, replay, endpoints] = await Promise.all([
    fetchEvents(),
    fetchReplayAnalysis(),
    fetchEndpoints(),
  ]);
  return buildOverviewView(emptyOverview, events, replay, endpoints);
};

export const fetchReplayBundle = async () => {
  const [analysis, recommendations] = await Promise.all([
    fetchReplayAnalysis(),
    fetchRecommendations(),
  ]);
  return { analysis, recommendations };
};
