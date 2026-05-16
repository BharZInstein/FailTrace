from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DeliveryState(str, Enum):
    DELIVERED = "delivered"
    RETRYING = "retrying"
    FAILED = "failed"
    EXPIRED = "expired"
    DUPLICATE = "duplicate"
    RECOVERED = "recovered"
    UNSAFE_TO_REPLAY = "unsafe_to_replay"


class FailureReason(str, Enum):
    NONE = "none"
    INVALID_SIGNATURE = "invalid_signature"
    TIMEOUT = "timeout"
    ENDPOINT_DELETED = "endpoint_deleted"
    RATE_LIMITED = "rate_limited"
    MALFORMED_RESPONSE = "malformed_response"
    DUPLICATE_EVENT = "duplicate_event"


class RecommendedAction(str, Enum):
    NONE = "No Action"
    RETRY_NOW = "Retry Now"
    DELAY_RETRY = "Delay Retry"
    STOP_RETRY = "Stop Retry"
    VERIFY_SECRET = "Verify Webhook Secret"
    CHECK_ENDPOINT = "Check Endpoint Status"


class WebhookAttemptIn(BaseModel):
    event_id: str = Field(..., examples=["evt_8c1a25"])
    endpoint_id: str = Field(..., examples=["ep_billing_prod"])
    attempt_number: int = Field(..., ge=1)
    status_code: int = Field(..., ge=0, le=599)
    response_time_ms: int = Field(..., ge=0)
    payload_size_kb: float = Field(..., ge=0)
    signature_valid: bool = True
    endpoint_active: bool = True
    duplicate_event: bool = False
    replay_count: int = Field(0, ge=0)
    created_at: str | None = None


class WebhookDecision(BaseModel):
    event_id: str
    endpoint_id: str
    delivery_state: DeliveryState
    failure_reason: FailureReason
    safe_to_replay: bool
    recommended_action: RecommendedAction
    endpoint_health_score: int
    replay_confidence_score: int
    explanation: list[str]
    features: dict[str, Any]


class AnalyticsSummary(BaseModel):
    total_attempts: int
    delivery_state_counts: dict[str, int]
    failure_reason_counts: dict[str, int]
    recommended_action_counts: dict[str, int]
    average_endpoint_health_score: float
    average_replay_confidence_score: float
