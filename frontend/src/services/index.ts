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
  FailureFingerprint,
  OverviewView,
  OverviewResponse,
  Recommendation,
  ReplayAnalysis,
  RetryOptimization,
  WebhookEvent,
} from "@/lib/types";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

const get = async <T>(path: string) => {
  const response = await apiClient.get<T>(path);
  return response.data;
};

export const fetchEvents = async (): Promise<WebhookEvent[]> => {
  if (useMock) {
    const data = await mockApi.getEvents();
    return mapWebhookEvents(data);
  }
  const data = await get("/events");
  return mapWebhookEvents(data);
};

export const fetchEvent = async (id: string): Promise<WebhookEvent> => {
  if (useMock) {
    const data = await mockApi.getEvent(id);
    return mapWebhookEvent(data);
  }
  const data = await get(`/event/${id}`);
  return mapWebhookEvent(data);
};

export const fetchEndpoints = async (): Promise<EndpointHealth[]> => {
  if (useMock) {
    const data = await mockApi.getHealth();
    return mapEndpointHealth(data);
  }
  const data = await get("/health");
  return mapEndpointHealth(data);
};

export const fetchFingerprints = async (): Promise<FailureFingerprint[]> => {
  if (useMock) {
    const data = await mockApi.getFingerprints();
    return mapFingerprints(data);
  }
  const data = await get("/fingerprints");
  return mapFingerprints(data);
};

export const fetchReplayAnalysis = async (): Promise<ReplayAnalysis> => {
  if (useMock) {
    const data = await mockApi.getReplayAnalysis();
    return mapReplayAnalysis(data);
  }
  const data = await get("/replay-analysis");
  return mapReplayAnalysis(data);
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  if (useMock) {
    return mockApi.getRecommendations();
  }
  return get("/recommendations");
};

export const fetchRetryOptimization = async (): Promise<RetryOptimization> => {
  if (useMock) {
    const data = await mockApi.getRetryOptimizer();
    return mapRetryOptimization(data);
  }
  const data = await get("/retry-optimizer");
  return mapRetryOptimization(data);
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
  const [overview, events, replay, endpoints] = await Promise.all([
    useMock ? mockApi.getOverview() : Promise.resolve(emptyOverview),
    fetchEvents(),
    fetchReplayAnalysis(),
    fetchEndpoints(),
  ]);
  return buildOverviewView(overview, events, replay, endpoints);
};

export const fetchReplayBundle = async () => {
  const [analysis, recommendations] = await Promise.all([
    fetchReplayAnalysis(),
    fetchRecommendations(),
  ]);
  return { analysis, recommendations };
};
