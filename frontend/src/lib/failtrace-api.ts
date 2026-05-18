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

const demoEvents: FailTraceEvent[] = [
  {
    event_id: "evt_pay_91k2",
    endpoint_id: "ep_checkout_prod",
    endpoint_url: "https://hooks.failtrace.dev/checkout-prod",
    status_code: 429,
    retry_count: 3,
    delivery_state: "retrying",
    failure_reason: "rate_limited",
    safe_to_replay: true,
    recommended_action: "Delay Retry",
    endpoint_health_score: 72,
    replay_confidence_score: 68,
    created_at: "2026-05-18T07:42:00.000Z",
    attempts: [
      {
        event_id: "evt_pay_91k2",
        endpoint_id: "ep_checkout_prod",
        attempt_number: 1,
        status_code: 429,
        response_time_ms: 186,
        created_at: "2026-05-18T07:37:00.000Z",
      },
      {
        event_id: "evt_pay_91k2",
        endpoint_id: "ep_checkout_prod",
        attempt_number: 2,
        status_code: 429,
        response_time_ms: 204,
        created_at: "2026-05-18T07:39:00.000Z",
      },
      {
        event_id: "evt_pay_91k2",
        endpoint_id: "ep_checkout_prod",
        attempt_number: 3,
        status_code: 429,
        response_time_ms: 197,
        created_at: "2026-05-18T07:42:00.000Z",
      },
    ],
    explanation: [
      "Classified as retrying from status 429.",
      "Primary failure reason is rate_limited.",
      "Delay retry to avoid compounding endpoint throttling.",
    ],
    features: {
      retry_count: 3,
      endpoint_success_rate: 0.84,
      average_response_time_ms: 196,
      decision_source: "rules",
    },
  },
  {
    event_id: "evt_inv_47qz",
    endpoint_id: "ep_billing_prod",
    endpoint_url: "https://hooks.failtrace.dev/billing-prod",
    status_code: 201,
    retry_count: 1,
    delivery_state: "recovered",
    failure_reason: "none",
    safe_to_replay: false,
    recommended_action: "No Action",
    endpoint_health_score: 91,
    replay_confidence_score: 22,
    created_at: "2026-05-18T07:35:00.000Z",
    attempts: [
      {
        event_id: "evt_inv_47qz",
        endpoint_id: "ep_billing_prod",
        attempt_number: 1,
        status_code: 503,
        response_time_ms: 612,
        created_at: "2026-05-18T07:31:00.000Z",
      },
      {
        event_id: "evt_inv_47qz",
        endpoint_id: "ep_billing_prod",
        attempt_number: 2,
        status_code: 201,
        response_time_ms: 122,
        created_at: "2026-05-18T07:35:00.000Z",
      },
    ],
    explanation: ["Classified as recovered from status 201.", "No replay is required for a delivered event."],
    features: {
      retry_count: 1,
      endpoint_success_rate: 0.96,
      average_response_time_ms: 153,
      decision_source: "rules",
    },
  },
  {
    event_id: "evt_user_8m13",
    endpoint_id: "ep_crm_sync",
    endpoint_url: "https://hooks.failtrace.dev/crm-sync",
    status_code: 401,
    retry_count: 2,
    delivery_state: "unsafe_to_replay",
    failure_reason: "invalid_signature",
    safe_to_replay: false,
    recommended_action: "Verify Webhook Secret",
    endpoint_health_score: 44,
    replay_confidence_score: 8,
    created_at: "2026-05-18T07:28:00.000Z",
    attempts: [
      {
        event_id: "evt_user_8m13",
        endpoint_id: "ep_crm_sync",
        attempt_number: 1,
        status_code: 401,
        response_time_ms: 88,
        created_at: "2026-05-18T07:24:00.000Z",
      },
      {
        event_id: "evt_user_8m13",
        endpoint_id: "ep_crm_sync",
        attempt_number: 2,
        status_code: 401,
        response_time_ms: 91,
        created_at: "2026-05-18T07:28:00.000Z",
      },
    ],
    explanation: [
      "Classified as unsafe_to_replay from status 401.",
      "Primary failure reason is invalid_signature.",
      "Replay should wait until the webhook secret is verified.",
    ],
    features: {
      retry_count: 2,
      endpoint_success_rate: 0.58,
      average_response_time_ms: 90,
      decision_source: "rules",
    },
  },
  {
    event_id: "evt_ship_62aa",
    endpoint_id: "ep_shipping_ops",
    endpoint_url: "https://hooks.failtrace.dev/shipping-ops",
    status_code: 504,
    retry_count: 4,
    delivery_state: "retrying",
    failure_reason: "timeout",
    safe_to_replay: true,
    recommended_action: "Delay Retry",
    endpoint_health_score: 61,
    replay_confidence_score: 57,
    created_at: "2026-05-18T07:19:00.000Z",
    attempts: [
      {
        event_id: "evt_ship_62aa",
        endpoint_id: "ep_shipping_ops",
        attempt_number: 1,
        status_code: 504,
        response_time_ms: 9012,
        created_at: "2026-05-18T07:12:00.000Z",
      },
      {
        event_id: "evt_ship_62aa",
        endpoint_id: "ep_shipping_ops",
        attempt_number: 4,
        status_code: 504,
        response_time_ms: 8733,
        created_at: "2026-05-18T07:19:00.000Z",
      },
    ],
    explanation: [
      "Classified as retrying from status 504.",
      "Primary failure reason is timeout.",
      "Endpoint health is moderate, so delayed retry is preferred.",
    ],
    features: {
      retry_count: 4,
      endpoint_success_rate: 0.72,
      average_response_time_ms: 8733,
      decision_source: "rules",
    },
  },
  {
    event_id: "evt_ref_20nx",
    endpoint_id: "ep_checkout_prod",
    endpoint_url: "https://hooks.failtrace.dev/checkout-prod",
    status_code: 200,
    retry_count: 0,
    delivery_state: "delivered",
    failure_reason: "none",
    safe_to_replay: false,
    recommended_action: "No Action",
    endpoint_health_score: 88,
    replay_confidence_score: 18,
    created_at: "2026-05-18T07:08:00.000Z",
    attempts: [
      {
        event_id: "evt_ref_20nx",
        endpoint_id: "ep_checkout_prod",
        attempt_number: 1,
        status_code: 200,
        response_time_ms: 144,
        created_at: "2026-05-18T07:08:00.000Z",
      },
    ],
    explanation: ["Classified as delivered from status 200."],
    features: {
      retry_count: 0,
      endpoint_success_rate: 0.88,
      average_response_time_ms: 144,
      decision_source: "rules",
    },
  },
  {
    event_id: "evt_sub_31bk",
    endpoint_id: "ep_billing_prod",
    endpoint_url: "https://hooks.failtrace.dev/billing-prod",
    status_code: 410,
    retry_count: 1,
    delivery_state: "unsafe_to_replay",
    failure_reason: "endpoint_deleted",
    safe_to_replay: false,
    recommended_action: "Check Endpoint Status",
    endpoint_health_score: 36,
    replay_confidence_score: 4,
    created_at: "2026-05-18T06:58:00.000Z",
    attempts: [
      {
        event_id: "evt_sub_31bk",
        endpoint_id: "ep_billing_prod",
        attempt_number: 1,
        status_code: 410,
        response_time_ms: 75,
        created_at: "2026-05-18T06:58:00.000Z",
      },
    ],
    explanation: [
      "Classified as unsafe_to_replay from status 410.",
      "Primary failure reason is endpoint_deleted.",
      "Endpoint status should be checked before retrying.",
    ],
    features: {
      retry_count: 1,
      endpoint_success_rate: 0.36,
      average_response_time_ms: 75,
      decision_source: "rules",
    },
  },
];

const demoEndpoints: EndpointMonitor[] = [
  {
    endpoint_id: "ep_checkout_prod",
    endpoint_url: "https://hooks.failtrace.dev/checkout-prod",
    avg_health_score: 84,
    total_events: 38,
    failure_rate: 18.4,
    last_seen: "2026-05-18T07:42:00.000Z",
    event_history: demoEvents
      .filter((event) => event.endpoint_id === "ep_checkout_prod")
      .flatMap((event) =>
        event.attempts.map((attempt) => ({
          ...attempt,
          health_score: event.endpoint_health_score,
          delivery_state: event.delivery_state,
        }))
      ),
    score_trend: [
      { time: "06:00", score: 92 },
      { time: "06:30", score: 89 },
      { time: "07:00", score: 86 },
      { time: "07:30", score: 84 },
    ],
  },
  {
    endpoint_id: "ep_billing_prod",
    endpoint_url: "https://hooks.failtrace.dev/billing-prod",
    avg_health_score: 76,
    total_events: 31,
    failure_rate: 22.6,
    last_seen: "2026-05-18T07:35:00.000Z",
    event_history: demoEvents
      .filter((event) => event.endpoint_id === "ep_billing_prod")
      .flatMap((event) =>
        event.attempts.map((attempt) => ({
          ...attempt,
          health_score: event.endpoint_health_score,
          delivery_state: event.delivery_state,
        }))
      ),
    score_trend: [
      { time: "06:00", score: 68 },
      { time: "06:30", score: 72 },
      { time: "07:00", score: 74 },
      { time: "07:30", score: 76 },
    ],
  },
  {
    endpoint_id: "ep_crm_sync",
    endpoint_url: "https://hooks.failtrace.dev/crm-sync",
    avg_health_score: 44,
    total_events: 19,
    failure_rate: 47.4,
    last_seen: "2026-05-18T07:28:00.000Z",
    event_history: demoEvents
      .filter((event) => event.endpoint_id === "ep_crm_sync")
      .flatMap((event) =>
        event.attempts.map((attempt) => ({
          ...attempt,
          health_score: event.endpoint_health_score,
          delivery_state: event.delivery_state,
        }))
      ),
    score_trend: [
      { time: "06:00", score: 63 },
      { time: "06:30", score: 55 },
      { time: "07:00", score: 48 },
      { time: "07:30", score: 44 },
    ],
  },
  {
    endpoint_id: "ep_shipping_ops",
    endpoint_url: "https://hooks.failtrace.dev/shipping-ops",
    avg_health_score: 61,
    total_events: 24,
    failure_rate: 33.3,
    last_seen: "2026-05-18T07:19:00.000Z",
    event_history: demoEvents
      .filter((event) => event.endpoint_id === "ep_shipping_ops")
      .flatMap((event) =>
        event.attempts.map((attempt) => ({
          ...attempt,
          health_score: event.endpoint_health_score,
          delivery_state: event.delivery_state,
        }))
      ),
    score_trend: [
      { time: "06:00", score: 79 },
      { time: "06:30", score: 69 },
      { time: "07:00", score: 63 },
      { time: "07:30", score: 61 },
    ],
  },
];

export const getHealth = async () => {
  try {
    const response = await failtraceApi.get("/health");
    return response.data as { status: string; service: string };
  } catch {
    return { status: "ok", service: "failtrace-api" };
  }
};

export const getEvents = async () => {
  try {
    const response = await failtraceApi.get<FailTraceEvent[]>("/events?limit=100");
    return response.data;
  } catch {
    return demoEvents;
  }
};

export const getEndpoints = async () => {
  try {
    const response = await failtraceApi.get<EndpointMonitor[]>("/endpoints");
    return response.data;
  } catch {
    return demoEndpoints;
  }
};

export const analyzeEvent = async (eventId: string) => {
  try {
    const response = await failtraceApi.post<AnalyzeResult>("/analyze", {
      event_id: eventId,
    });
    return response.data;
  } catch {
    const event = demoEvents.find((item) => item.event_id === eventId) ?? demoEvents[0];
    return {
      event_id: event.event_id,
      endpoint_id: event.endpoint_id,
      delivery_state: event.delivery_state,
      failure_reason: event.failure_reason,
      safe_to_replay: event.safe_to_replay,
      recommended_action: event.recommended_action,
      endpoint_health_score: event.endpoint_health_score,
      replay_confidence_score: event.replay_confidence_score,
      explanation: event.explanation,
      features: event.features,
    };
  }
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
