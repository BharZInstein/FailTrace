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

export type AnalyticsSummary = {
  total_attempts: number;
  delivery_state_counts: Record<string, number>;
  failure_reason_counts: Record<string, number>;
  recommended_action_counts: Record<string, number>;
  average_endpoint_health_score: number;
  average_replay_confidence_score: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const requireApiBase = () => {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
};

export const getHealth = async () => {
  requireApiBase();
  const response = await axios.get<{ status: string; service: string }>(`${API_BASE}/health`);
  return response.data;
};

export const getEvents = async () => {
  requireApiBase();
  const response = await axios.get<FailTraceEvent[]>(`${API_BASE}/events?limit=100`);
  return response.data;
};

export const getEndpoints = async () => {
  requireApiBase();
  const response = await axios.get<EndpointMonitor[]>(`${API_BASE}/endpoints`);
  return response.data;
};

export const getAnalyticsSummary = async () => {
  requireApiBase();
  const response = await axios.get<AnalyticsSummary>(`${API_BASE}/analytics/summary`);
  return response.data;
};

export const analyzeEvent = async (eventId: string) => {
  requireApiBase();
  const response = await axios.post<AnalyzeResult>(`${API_BASE}/analyze`, {
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
