import axios from "axios";

export type FailTraceEvent = {
  event_id: string;
  endpoint_id: string;
  endpoint_url: string;
  status_code: number;
  retry_count: number;
  delivery_state: string;
  failure_reason: string;
  safe_to_replay: boolean;
  recommended_action: string;
  endpoint_health_score: number;
  replay_confidence_score: number;
  created_at: string;
  attempts: {
    event_id: string;
    endpoint_id: string;
    attempt_number: number;
    status_code: number;
    response_time_ms: number;
    created_at: string;
  }[];
  explanation: string[];
  features: Record<string, string | number | boolean>;
};

export type EndpointMonitor = {
  endpoint_id: string;
  endpoint_url: string;
  avg_health_score: number;
  total_events: number;
  failure_rate: number;
  last_seen: string;
  event_history: {
    event_id: string;
    created_at: string;
    status_code: number;
    attempt_number: number;
    response_time_ms: number;
    health_score: number;
    delivery_state: string;
  }[];
  score_trend: { time: string; score: number }[];
};

export type AnalyzeResult = {
  event_id: string;
  endpoint_id: string;
  delivery_state: string;
  failure_reason: string;
  safe_to_replay: boolean;
  recommended_action: string;
  endpoint_health_score: number;
  replay_confidence_score: number;
  explanation: string[];
  features: Record<string, string | number | boolean>;
};

export const failtraceApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
});

export const getHealth = async () => {
  const response = await failtraceApi.get("/health");
  return response.data as { status: string; service: string };
};

export const getEvents = async () => {
  const response = await failtraceApi.get<FailTraceEvent[]>("/events?limit=100");
  return response.data;
};

export const getEndpoints = async () => {
  const response = await failtraceApi.get<EndpointMonitor[]>("/endpoints");
  return response.data;
};

export const analyzeEvent = async (eventId: string) => {
  const response = await failtraceApi.post<AnalyzeResult>("/analyze", {
    event_id: eventId,
  });
  return response.data;
};

export const formatState = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
