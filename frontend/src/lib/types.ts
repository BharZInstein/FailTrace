export type Trend = "up" | "down" | "flat";
export type Tone = "success" | "warning" | "danger" | "info";
export type DeliveryState = "Delivered" | "Failed" | "Recovered" | "Queued";
export type EndpointStatus = "Healthy" | "Unstable" | "Critical";

export type MetricResponse = {
  key: string;
  title: string;
  value: number;
  unit?: string;
  change: number;
  trend: Trend;
  tone: Tone;
};

export type RetryAttemptResponse = {
  time: string;
  status: string;
  latency_ms?: number;
};

export type WebhookEventResponse = {
  id: string;
  type: string;
  endpoint_id: string;
  delivery_state: DeliveryState;
  failure_reason: string;
  replay_confidence: {
    score: number;
    reasons: string[];
    duplicate_risk: number;
  };
  endpoint_health: {
    score: number;
    reasons: string[];
  };
  recommended_action: string;
  timestamp: string;
  retry_pattern: string[];
  attempts: RetryAttemptResponse[];
};

export type EndpointHealthResponse = {
  endpoint_id: string;
  name: string;
  score: number;
  success_rate: number;
  failure_streak: number;
  avg_latency_ms: number;
  timeout_frequency: number;
  status: EndpointStatus;
  reasons: string[];
};

export type FailureFingerprintResponse = {
  id: string;
  label: string;
  sequence: string;
  recovery_rate: number;
  avg_retries: number;
  dominant_cause: string;
  replay_safety: number;
  action: string;
};

export type ReplayAnalysisResponse = {
  confidence_score: number;
  duplicate_risk_score: number;
  unsafe_score: number;
  confidence_distribution: { band: string; value: number }[];
  duplicate_risk_distribution: { band: string; value: number }[];
};

export type RecommendationResponse = {
  id: string;
  title: string;
  detail: string;
  severity: Tone;
};

export type RetryOptimizationDecisionResponse = {
  id: string;
  action: string;
  confidence: number;
  insight: string;
  outcome_lift: number;
};

export type RetryOptimizationResponse = {
  decisions: RetryOptimizationDecisionResponse[];
  reward_trend: { cycle: string; reward: number; success_lift: number }[];
};

export type OverviewResponse = {
  metrics: MetricResponse[];
  delivery_distribution: { name: string; value: number }[];
  failure_trend: { time: string; failed: number; recovered: number }[];
  endpoint_health_overview: { name: string; score: number }[];
  replay_confidence_distribution: { band: string; value: number }[];
  retry_pattern_stats: { pattern: string; count: number }[];
};

export type Metric = {
  title: string;
  value: string;
  change: string;
  trend: Trend;
  tone: Tone;
};

export type WebhookEvent = {
  id: string;
  type: string;
  endpointId: string;
  deliveryState: DeliveryState;
  failureReason: string;
  replayConfidenceScore: number;
  replayConfidenceReasons: string[];
  duplicateRiskScore: number;
  endpointHealthScore: number;
  endpointHealthReasons: string[];
  recommendedAction: string;
  timestamp: string;
  retryPattern: string[];
  attempts: { time: string; status: string; latencyMs?: number }[];
};

export type EndpointHealth = {
  id: string;
  name: string;
  score: number;
  successRate: number;
  failureStreak: number;
  avgLatency: number;
  timeoutFrequency: number;
  status: EndpointStatus;
  reasons: string[];
};

export type FailureFingerprint = {
  id: string;
  label: string;
  sequence: string;
  recoveryRate: number;
  avgRetries: number;
  dominantCause: string;
  replaySafety: number;
  action: string;
};

export type ReplayAnalysis = {
  confidenceScore: number;
  duplicateRiskScore: number;
  unsafeScore: number;
  confidenceDistribution: { band: string; value: number }[];
  duplicateRiskDistribution: { band: string; value: number }[];
};

export type Recommendation = RecommendationResponse;

export type RLDecision = {
  id: string;
  action: string;
  confidence: number;
  insight: string;
  outcomeLift: number;
};

export type RetryOptimization = {
  decisions: RLDecision[];
  rewardTrend: { cycle: string; reward: number; successLift: number }[];
};

export type OverviewView = {
  metrics: Metric[];
  deliveryDistribution: { name: string; value: number }[];
  failureTrend: { time: string; failed: number; recovered: number }[];
  endpointHealthOverview: { name: string; score: number }[];
  replayConfidenceDistribution: { band: string; value: number }[];
  retryPatternStats: { pattern: string; count: number }[];
};
