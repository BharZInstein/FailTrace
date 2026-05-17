from __future__ import annotations

from collections import defaultdict
from typing import Any

import pandas as pd

from app.models import (
    DeliveryState,
    FailureReason,
    RecommendedAction,
    WebhookAttemptIn,
    WebhookDecision,
)

try:
    from app.ml_logic import WebhookMLSystem
except Exception:  # pragma: no cover - keeps API bootable if ML deps are missing.
    WebhookMLSystem = None  # type: ignore[assignment]


SUCCESS_CODES = set(range(200, 300))
RETRYABLE_CODES = {408, 425, 429, 500, 502, 503, 504}
ML_SYSTEM = None
ML_LOAD_ERROR: str | None = None


def get_ml_system():
    global ML_SYSTEM, ML_LOAD_ERROR
    if WebhookMLSystem is None:
        ML_LOAD_ERROR = "ML dependencies are not available."
        return None
    if ML_SYSTEM is not None:
        return ML_SYSTEM
    try:
        system = WebhookMLSystem(data_dir="data", model_dir="models")
        system.load_models()
        ML_SYSTEM = system
        ML_LOAD_ERROR = None
        return ML_SYSTEM
    except Exception as exc:  # pragma: no cover - runtime environment/model artifact guard.
        ML_LOAD_ERROR = str(exc)
        return None


def _clamp_score(value: float) -> int:
    return int(max(0, min(100, round(value))))


def detect_failure_reason(attempt: WebhookAttemptIn) -> FailureReason:
    if attempt.duplicate_event:
        return FailureReason.DUPLICATE_EVENT
    if not attempt.signature_valid:
        return FailureReason.INVALID_SIGNATURE
    if not attempt.endpoint_active or attempt.status_code == 410:
        return FailureReason.ENDPOINT_DELETED
    if attempt.status_code == 429:
        return FailureReason.RATE_LIMITED
    if attempt.status_code in {408, 504} or attempt.response_time_ms >= 8_000:
        return FailureReason.TIMEOUT
    if attempt.status_code >= 500 or attempt.status_code in {400, 422}:
        return FailureReason.MALFORMED_RESPONSE
    return FailureReason.NONE


def normalize_ml_failure_reason(value: str) -> FailureReason:
    mapping = {
        "none": FailureReason.NONE,
        "invalid_signature": FailureReason.INVALID_SIGNATURE,
        "timeout": FailureReason.TIMEOUT,
        "endpoint_deleted": FailureReason.ENDPOINT_DELETED,
        "customer_endpoint_down": FailureReason.ENDPOINT_DELETED,
        "rate_limited": FailureReason.RATE_LIMITED,
        "malformed_response": FailureReason.MALFORMED_RESPONSE,
        "payload_too_large": FailureReason.MALFORMED_RESPONSE,
        "duplicate_event": FailureReason.DUPLICATE_EVENT,
        "replay_without_fix": FailureReason.DUPLICATE_EVENT,
    }
    return mapping.get(str(value), FailureReason.NONE)


def normalize_ml_action(value: str) -> RecommendedAction:
    mapping = {
        "none": RecommendedAction.NONE,
        "Retry Now": RecommendedAction.RETRY_NOW,
        "retry_now": RecommendedAction.RETRY_NOW,
        "Delay Retry": RecommendedAction.DELAY_RETRY,
        "wait_and_retry": RecommendedAction.DELAY_RETRY,
        "apply_exponential_backoff": RecommendedAction.DELAY_RETRY,
        "Stop Retry": RecommendedAction.STOP_RETRY,
        "fix_retry_logic": RecommendedAction.STOP_RETRY,
        "Verify Webhook Secret": RecommendedAction.VERIFY_SECRET,
        "verify_signature_config": RecommendedAction.VERIFY_SECRET,
        "Check Endpoint Status": RecommendedAction.CHECK_ENDPOINT,
        "contact_customer_endpoint_deleted": RecommendedAction.CHECK_ENDPOINT,
        "reduce_payload_size": RecommendedAction.STOP_RETRY,
        "investigate": RecommendedAction.STOP_RETRY,
    }
    return mapping.get(str(value), RecommendedAction.NONE)


def classify_delivery_state(attempt: WebhookAttemptIn, failure_reason: FailureReason) -> DeliveryState:
    if failure_reason == FailureReason.DUPLICATE_EVENT:
        return DeliveryState.DUPLICATE
    if attempt.status_code in SUCCESS_CODES and attempt.attempt_number > 1:
        return DeliveryState.RECOVERED
    if attempt.status_code in SUCCESS_CODES:
        return DeliveryState.DELIVERED
    if attempt.replay_count >= 3 or attempt.attempt_number >= 8:
        return DeliveryState.EXPIRED
    if failure_reason in {
        FailureReason.INVALID_SIGNATURE,
        FailureReason.ENDPOINT_DELETED,
        FailureReason.DUPLICATE_EVENT,
    }:
        return DeliveryState.UNSAFE_TO_REPLAY
    if attempt.status_code in RETRYABLE_CODES:
        return DeliveryState.RETRYING
    return DeliveryState.FAILED


def score_endpoint_health(endpoint_history: pd.DataFrame, attempt: WebhookAttemptIn) -> int:
    if endpoint_history.empty:
        success_rate = 1.0 if attempt.status_code in SUCCESS_CODES else 0.0
        avg_response_ms = attempt.response_time_ms
        timeout_rate = 1.0 if attempt.response_time_ms >= 8_000 else 0.0
        signature_mismatch_rate = 0.0 if attempt.signature_valid else 1.0
    else:
        success_rate = endpoint_history["status_code"].between(200, 299).mean()
        avg_response_ms = endpoint_history["response_time_ms"].mean()
        timeout_rate = (endpoint_history["response_time_ms"] >= 8_000).mean()
        signature_mismatch_rate = (~endpoint_history["signature_valid"].astype(bool)).mean()

    response_penalty = min(avg_response_ms / 100, 35)
    timeout_penalty = timeout_rate * 25
    signature_penalty = signature_mismatch_rate * 25
    inactive_penalty = 40 if not attempt.endpoint_active else 0
    health = (success_rate * 100) - response_penalty - timeout_penalty - signature_penalty - inactive_penalty
    return _clamp_score(health)


def score_replay_confidence(
    attempt: WebhookAttemptIn,
    delivery_state: DeliveryState,
    failure_reason: FailureReason,
    endpoint_health_score: int,
) -> int:
    confidence = endpoint_health_score * 0.7
    confidence += max(0, 20 - attempt.replay_count * 8)
    confidence -= max(0, attempt.attempt_number - 1) * 5

    if failure_reason in {FailureReason.INVALID_SIGNATURE, FailureReason.ENDPOINT_DELETED, FailureReason.DUPLICATE_EVENT}:
        confidence -= 55
    elif failure_reason == FailureReason.RATE_LIMITED:
        confidence -= 20
    elif failure_reason == FailureReason.TIMEOUT:
        confidence -= 10

    if delivery_state in {DeliveryState.DELIVERED, DeliveryState.RECOVERED}:
        confidence -= 40

    return _clamp_score(confidence)


def recommend_action(
    attempt: WebhookAttemptIn,
    failure_reason: FailureReason,
    delivery_state: DeliveryState,
    replay_confidence_score: int,
) -> RecommendedAction:
    if delivery_state in {DeliveryState.DELIVERED, DeliveryState.RECOVERED}:
        return RecommendedAction.NONE
    if failure_reason == FailureReason.INVALID_SIGNATURE:
        return RecommendedAction.VERIFY_SECRET
    if failure_reason == FailureReason.ENDPOINT_DELETED:
        return RecommendedAction.CHECK_ENDPOINT
    if failure_reason == FailureReason.DUPLICATE_EVENT:
        return RecommendedAction.STOP_RETRY
    if failure_reason == FailureReason.RATE_LIMITED:
        return RecommendedAction.DELAY_RETRY
    if failure_reason == FailureReason.TIMEOUT and attempt.attempt_number < 5:
        return RecommendedAction.DELAY_RETRY
    if replay_confidence_score < 35:
        return RecommendedAction.STOP_RETRY
    return RecommendedAction.RETRY_NOW


def build_features(attempt: WebhookAttemptIn, endpoint_history: pd.DataFrame) -> dict[str, Any]:
    if endpoint_history.empty:
        endpoint_success_rate = 1.0 if attempt.status_code in SUCCESS_CODES else 0.0
        timeout_frequency = 1.0 if attempt.response_time_ms >= 8_000 else 0.0
        signature_mismatch_frequency = 0.0 if attempt.signature_valid else 1.0
        average_response_time_ms = float(attempt.response_time_ms)
    else:
        endpoint_success_rate = float(endpoint_history["status_code"].between(200, 299).mean())
        timeout_frequency = float((endpoint_history["response_time_ms"] >= 8_000).mean())
        signature_mismatch_frequency = float((~endpoint_history["signature_valid"].astype(bool)).mean())
        average_response_time_ms = float(endpoint_history["response_time_ms"].mean())

    return {
        "retry_count": max(0, attempt.attempt_number - 1),
        "timeout_frequency": round(timeout_frequency, 3),
        "average_response_time_ms": round(average_response_time_ms, 2),
        "endpoint_success_rate": round(endpoint_success_rate, 3),
        "replay_frequency": attempt.replay_count,
        "payload_size_kb": attempt.payload_size_kb,
        "signature_mismatch_frequency": round(signature_mismatch_frequency, 3),
        "endpoint_activity_status": "active" if attempt.endpoint_active else "inactive",
    }


def explain_decision(
    attempt: WebhookAttemptIn,
    failure_reason: FailureReason,
    delivery_state: DeliveryState,
    replay_confidence_score: int,
) -> list[str]:
    explanation = [f"Classified as {delivery_state.value} from status {attempt.status_code}."]
    if failure_reason != FailureReason.NONE:
        explanation.append(f"Primary failure reason is {failure_reason.value}.")
    if attempt.attempt_number > 1:
        explanation.append(f"Observed retry depth: {attempt.attempt_number - 1}.")
    if attempt.replay_count:
        explanation.append(f"Previous replay count lowers confidence: {attempt.replay_count}.")
    if replay_confidence_score < 50:
        explanation.append("Replay confidence is low; manual verification is recommended.")
    return explanation


def analyze_attempt(
    attempt: WebhookAttemptIn,
    history: pd.DataFrame | None = None,
    use_ml: bool = True,
) -> WebhookDecision:
    history = history if history is not None else pd.DataFrame()
    endpoint_history = history[history["endpoint_id"] == attempt.endpoint_id] if not history.empty else pd.DataFrame()

    failure_reason = detect_failure_reason(attempt)
    delivery_state = classify_delivery_state(attempt, failure_reason)
    endpoint_health_score = score_endpoint_health(endpoint_history, attempt)
    replay_confidence_score = score_replay_confidence(
        attempt, delivery_state, failure_reason, endpoint_health_score
    )
    safe_to_replay = (
        replay_confidence_score >= 55
        and delivery_state not in {DeliveryState.DELIVERED, DeliveryState.DUPLICATE, DeliveryState.UNSAFE_TO_REPLAY}
    )
    recommended_action = recommend_action(attempt, failure_reason, delivery_state, replay_confidence_score)
    features = build_features(attempt, endpoint_history)
    explanation = explain_decision(attempt, failure_reason, delivery_state, replay_confidence_score)

    ml_system = get_ml_system() if use_ml else None
    if ml_system is not None:
        try:
            response_category = "success" if attempt.status_code in SUCCESS_CODES else "server_error"
            if attempt.status_code == 429:
                response_category = "rate_limited"
            elif not attempt.signature_valid:
                response_category = "invalid_signature"
            elif not attempt.endpoint_active or attempt.status_code in {404, 410}:
                response_category = "endpoint_not_found"
            elif attempt.status_code in {408, 504} or attempt.response_time_ms >= 8_000:
                response_category = "timeout"

            events_df = pd.DataFrame(
                [
                    {
                        "event_id": attempt.event_id,
                        "event_type": "webhook.event",
                        "priority": "normal",
                        "payload_size_kb": attempt.payload_size_kb,
                    }
                ]
            )
            attempts_df = pd.DataFrame(
                [
                    {
                        "event_id": attempt.event_id,
                        "endpoint_id": attempt.endpoint_id,
                        "attempt_number": attempt.attempt_number,
                        "http_status": attempt.status_code,
                        "response_time_ms": attempt.response_time_ms,
                        "response_body_category": response_category,
                        "timeout": attempt.status_code in {408, 504} or attempt.response_time_ms >= 8_000,
                        "signature_valid": attempt.signature_valid,
                    }
                ]
            )
            endpoints_df = pd.DataFrame(
                [
                    {
                        "endpoint_id": attempt.endpoint_id,
                        "avg_success_rate": features["endpoint_success_rate"] or 0.5,
                        "rate_limit_per_minute": 60,
                    }
                ]
            )
            ml_result = ml_system.predict(events_df, attempts_df, endpoints_df)[0]
            ml_failure_reason = normalize_ml_failure_reason(str(ml_result["failure_reason"]))
            ml_action = normalize_ml_action(str(ml_result["recommended_action"]))

            hard_blocked = failure_reason in {
                FailureReason.INVALID_SIGNATURE,
                FailureReason.ENDPOINT_DELETED,
                FailureReason.DUPLICATE_EVENT,
            }
            if failure_reason == FailureReason.NONE and ml_failure_reason != FailureReason.NONE:
                failure_reason = ml_failure_reason
                delivery_state = classify_delivery_state(attempt, failure_reason)
            if ml_action != RecommendedAction.NONE:
                recommended_action = ml_action

            endpoint_health_score = _clamp_score(float(ml_result["endpoint_health_score"]))
            replay_confidence_score = _clamp_score(float(ml_result["replay_confidence_score"]))
            safe_to_replay = bool(ml_result["safe_to_replay"]) and not hard_blocked and delivery_state not in {
                DeliveryState.DELIVERED,
                DeliveryState.DUPLICATE,
                DeliveryState.UNSAFE_TO_REPLAY,
            }
            if hard_blocked:
                safe_to_replay = False
            features["ml_failure_reason_raw"] = str(ml_result["failure_reason"])
            features["ml_recommended_action_raw"] = str(ml_result["recommended_action"])
            features["decision_source"] = "ml_with_rule_guardrails"
            explanation = explain_decision(attempt, failure_reason, delivery_state, replay_confidence_score)
            explanation.append("ML intelligence layer scored replay risk with deterministic safety guardrails.")
        except Exception as exc:
            features["decision_source"] = "rules_fallback"
            features["ml_error"] = str(exc)
    else:
        features["decision_source"] = "rules" if use_ml else "rules_bulk_view"
        if ML_LOAD_ERROR:
            features["ml_error"] = ML_LOAD_ERROR

    return WebhookDecision(
        event_id=attempt.event_id,
        endpoint_id=attempt.endpoint_id,
        delivery_state=delivery_state,
        failure_reason=failure_reason,
        safe_to_replay=safe_to_replay,
        recommended_action=recommended_action,
        endpoint_health_score=endpoint_health_score,
        replay_confidence_score=replay_confidence_score,
        explanation=explanation,
        features=features,
    )


def analyze_dataframe(df: pd.DataFrame, use_ml: bool = False) -> pd.DataFrame:
    decisions = []
    history_by_endpoint: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for _, row in df.sort_values(["endpoint_id", "created_at", "attempt_number"]).iterrows():
        attempt = WebhookAttemptIn(**row.to_dict())
        history = pd.DataFrame(history_by_endpoint[attempt.endpoint_id])
        decision = analyze_attempt(attempt, history, use_ml=use_ml)
        decisions.append(decision.model_dump(mode="json"))
        history_by_endpoint[attempt.endpoint_id].append(row.to_dict())

    return pd.DataFrame(decisions)
