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
  {
    event_id: "evt_order_77hf",
    endpoint_id: "ep_fulfillment_prod",
    endpoint_url: "https://hooks.failtrace.dev/fulfillment-prod",
    status_code: 500,
    retry_count: 5,
    delivery_state: "expired",
    failure_reason: "malformed_response",
    safe_to_replay: false,
    recommended_action: "Stop Retry",
    endpoint_health_score: 28,
    replay_confidence_score: 12,
    created_at: "2026-05-18T06:47:00.000Z",
    attempts: [
      {
        event_id: "evt_order_77hf",
        endpoint_id: "ep_fulfillment_prod",
        attempt_number: 1,
        status_code: 500,
        response_time_ms: 781,
        created_at: "2026-05-18T06:38:00.000Z",
      },
      {
        event_id: "evt_order_77hf",
        endpoint_id: "ep_fulfillment_prod",
        attempt_number: 5,
        status_code: 500,
        response_time_ms: 842,
        created_at: "2026-05-18T06:47:00.000Z",
      },
    ],
    explanation: [
      "Classified as expired from repeated 500 responses.",
      "Primary failure reason is malformed_response.",
      "Retry should stop until the endpoint response contract is fixed.",
    ],
    features: {
      retry_count: 5,
      endpoint_success_rate: 0.41,
      average_response_time_ms: 812,
      decision_source: "rules",
    },
  },
  {
    event_id: "evt_cart_18nd",
    endpoint_id: "ep_retail_web",
    endpoint_url: "https://hooks.failtrace.dev/retail-web",
    status_code: 502,
    retry_count: 2,
    delivery_state: "retrying",
    failure_reason: "malformed_response",
    safe_to_replay: true,
    recommended_action: "Retry Now",
    endpoint_health_score: 67,
    replay_confidence_score: 64,
    created_at: "2026-05-18T06:32:00.000Z",
    attempts: [
      {
        event_id: "evt_cart_18nd",
        endpoint_id: "ep_retail_web",
        attempt_number: 1,
        status_code: 502,
        response_time_ms: 391,
        created_at: "2026-05-18T06:29:00.000Z",
      },
      {
        event_id: "evt_cart_18nd",
        endpoint_id: "ep_retail_web",
        attempt_number: 2,
        status_code: 502,
        response_time_ms: 372,
        created_at: "2026-05-18T06:32:00.000Z",
      },
    ],
    explanation: [
      "Classified as retrying from status 502.",
      "Primary failure reason is malformed_response.",
      "Replay confidence is acceptable for an immediate retry.",
    ],
    features: {
      retry_count: 2,
      endpoint_success_rate: 0.79,
      average_response_time_ms: 382,
      decision_source: "rules",
    },
  },
  {
    event_id: "evt_alert_55zk",
    endpoint_id: "ep_security_events",
    endpoint_url: "https://hooks.failtrace.dev/security-events",
    status_code: 202,
    retry_count: 0,
    delivery_state: "delivered",
    failure_reason: "none",
    safe_to_replay: false,
    recommended_action: "No Action",
    endpoint_health_score: 97,
    replay_confidence_score: 15,
    created_at: "2026-05-18T06:21:00.000Z",
    attempts: [
      {
        event_id: "evt_alert_55zk",
        endpoint_id: "ep_security_events",
        attempt_number: 1,
        status_code: 202,
        response_time_ms: 98,
        created_at: "2026-05-18T06:21:00.000Z",
      },
    ],
    explanation: ["Classified as delivered from status 202."],
    features: {
      retry_count: 0,
      endpoint_success_rate: 0.98,
      average_response_time_ms: 98,
      decision_source: "rules",
    },
  },
];

const demoEndpoints: EndpointMonitor[] = [
  {
    endpoint_id: "ep_checkout_prod",
    endpoint_url: "https://hooks.failtrace.dev/checkout-prod",
    avg_health_score: 84,
    total_events: 482,
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
      { time: "00:00", score: 96 },
      { time: "01:00", score: 94 },
      { time: "02:00", score: 91 },
      { time: "03:00", score: 89 },
      { time: "04:00", score: 87 },
      { time: "05:00", score: 86 },
      { time: "06:00", score: 85 },
      { time: "07:00", score: 84 },
    ],
  },
  {
    endpoint_id: "ep_billing_prod",
    endpoint_url: "https://hooks.failtrace.dev/billing-prod",
    avg_health_score: 76,
    total_events: 391,
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
      { time: "00:00", score: 66 },
      { time: "01:00", score: 69 },
      { time: "02:00", score: 71 },
      { time: "03:00", score: 73 },
      { time: "04:00", score: 72 },
      { time: "05:00", score: 74 },
      { time: "06:00", score: 75 },
      { time: "07:00", score: 76 },
    ],
  },
  {
    endpoint_id: "ep_crm_sync",
    endpoint_url: "https://hooks.failtrace.dev/crm-sync",
    avg_health_score: 44,
    total_events: 276,
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
      { time: "00:00", score: 72 },
      { time: "01:00", score: 69 },
      { time: "02:00", score: 61 },
      { time: "03:00", score: 56 },
      { time: "04:00", score: 53 },
      { time: "05:00", score: 49 },
      { time: "06:00", score: 46 },
      { time: "07:00", score: 44 },
    ],
  },
  {
    endpoint_id: "ep_shipping_ops",
    endpoint_url: "https://hooks.failtrace.dev/shipping-ops",
    avg_health_score: 61,
    total_events: 344,
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
      { time: "00:00", score: 82 },
      { time: "01:00", score: 78 },
      { time: "02:00", score: 74 },
      { time: "03:00", score: 70 },
      { time: "04:00", score: 66 },
      { time: "05:00", score: 64 },
      { time: "06:00", score: 62 },
      { time: "07:00", score: 61 },
    ],
  },
  {
    endpoint_id: "ep_fulfillment_prod",
    endpoint_url: "https://hooks.failtrace.dev/fulfillment-prod",
    avg_health_score: 28,
    total_events: 219,
    failure_rate: 58.9,
    last_seen: "2026-05-18T06:47:00.000Z",
    event_history: demoEvents
      .filter((event) => event.endpoint_id === "ep_fulfillment_prod")
      .flatMap((event) =>
        event.attempts.map((attempt) => ({
          ...attempt,
          health_score: event.endpoint_health_score,
          delivery_state: event.delivery_state,
        }))
      ),
    score_trend: [
      { time: "00:00", score: 57 },
      { time: "01:00", score: 51 },
      { time: "02:00", score: 46 },
      { time: "03:00", score: 40 },
      { time: "04:00", score: 36 },
      { time: "05:00", score: 31 },
      { time: "06:00", score: 29 },
      { time: "07:00", score: 28 },
    ],
  },
  {
    endpoint_id: "ep_retail_web",
    endpoint_url: "https://hooks.failtrace.dev/retail-web",
    avg_health_score: 67,
    total_events: 307,
    failure_rate: 27.7,
    last_seen: "2026-05-18T06:32:00.000Z",
    event_history: demoEvents
      .filter((event) => event.endpoint_id === "ep_retail_web")
      .flatMap((event) =>
        event.attempts.map((attempt) => ({
          ...attempt,
          health_score: event.endpoint_health_score,
          delivery_state: event.delivery_state,
        }))
      ),
    score_trend: [
      { time: "00:00", score: 73 },
      { time: "01:00", score: 72 },
      { time: "02:00", score: 70 },
      { time: "03:00", score: 69 },
      { time: "04:00", score: 66 },
      { time: "05:00", score: 65 },
      { time: "06:00", score: 67 },
      { time: "07:00", score: 67 },
    ],
  },
  {
    endpoint_id: "ep_security_events",
    endpoint_url: "https://hooks.failtrace.dev/security-events",
    avg_health_score: 97,
    total_events: 529,
    failure_rate: 4.3,
    last_seen: "2026-05-18T06:21:00.000Z",
    event_history: demoEvents
      .filter((event) => event.endpoint_id === "ep_security_events")
      .flatMap((event) =>
        event.attempts.map((attempt) => ({
          ...attempt,
          health_score: event.endpoint_health_score,
          delivery_state: event.delivery_state,
        }))
      ),
    score_trend: [
      { time: "00:00", score: 95 },
      { time: "01:00", score: 96 },
      { time: "02:00", score: 96 },
      { time: "03:00", score: 97 },
      { time: "04:00", score: 97 },
      { time: "05:00", score: 98 },
      { time: "06:00", score: 97 },
      { time: "07:00", score: 97 },
    ],
  },
];

const eventStatuses = [200, 201, 202, 204, 200, 201, 202, 200, 201, 429, 500, 502, 503, 504, 401, 410, 400];
const endpointIds = demoEndpoints.map((endpoint) => endpoint.endpoint_id);
const endpointUrls = Object.fromEntries(
  demoEndpoints.map((endpoint) => [endpoint.endpoint_id, endpoint.endpoint_url])
);

const expandedDemoEvents: FailTraceEvent[] = Array.from({ length: 85 }, (_, index) => {
  const baseEvent = demoEvents[index % demoEvents.length];
  if (index < demoEvents.length) return baseEvent;

  const endpoint_id = endpointIds[index % endpointIds.length];
  const status_code = eventStatuses[index % eventStatuses.length];
  const retry_count = index % 6;
  const delivered = status_code >= 200 && status_code < 300;
  const rateLimited = status_code === 429;
  const timeout = status_code === 504;
  const unauthorized = status_code === 401;
  const endpointGone = status_code === 410;
  const unsafe = unauthorized || endpointGone || status_code === 400;
  const failure_reason = delivered
    ? "none"
    : rateLimited
      ? "rate_limited"
      : timeout
        ? "timeout"
        : unauthorized
          ? "invalid_signature"
          : endpointGone
            ? "endpoint_deleted"
            : "malformed_response";
  const delivery_state = delivered
    ? retry_count > 0
      ? "recovered"
      : "delivered"
    : unsafe
      ? "unsafe_to_replay"
      : retry_count >= 5
        ? "expired"
        : "retrying";
  const safe_to_replay = !delivered && !unsafe && retry_count < 5;
  const recommended_action = delivered
    ? "No Action"
    : unauthorized
      ? "Verify Webhook Secret"
      : rateLimited || timeout
        ? "Delay Retry"
        : safe_to_replay
          ? "Retry Now"
          : "Stop Retry";
  const endpoint_health_score = Math.max(28, Math.min(98, 96 - (index % 8) * 5));
  const replay_confidence_score = delivered ? 18 : safe_to_replay ? 62 + (index % 20) : 10 + (index % 24);
  const minute = String(59 - (index % 50)).padStart(2, "0");

  return {
    event_id: `evt_demo_${String(index + 1).padStart(2, "0")}`,
    endpoint_id,
    endpoint_url: endpointUrls[endpoint_id],
    status_code,
    retry_count,
    delivery_state,
    failure_reason,
    safe_to_replay,
    recommended_action,
    endpoint_health_score,
    replay_confidence_score,
    created_at: `2026-05-18T06:${minute}:00.000Z`,
    attempts: [
      {
        event_id: `evt_demo_${String(index + 1).padStart(2, "0")}`,
        endpoint_id,
        attempt_number: Math.max(1, retry_count + 1),
        status_code,
        response_time_ms: timeout ? 8200 + index * 11 : 110 + index * 9,
        created_at: `2026-05-18T06:${minute}:00.000Z`,
      },
    ],
    explanation: [
      `Classified as ${delivery_state} from status ${status_code}.`,
      failure_reason === "none" ? "No replay action is required." : `Primary failure reason is ${failure_reason}.`,
    ],
    features: {
      retry_count,
      endpoint_success_rate: delivered ? 0.94 : 0.62,
      average_response_time_ms: timeout ? 8200 + index * 11 : 110 + index * 9,
      decision_source: "rules",
    },
  };
});

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
    return expandedDemoEvents;
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
    const event = expandedDemoEvents.find((item) => item.event_id === eventId) ?? expandedDemoEvents[0];
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
