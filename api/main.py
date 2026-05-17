from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import SAMPLE_CSV_PATH
from app.engine import analyze_attempt, analyze_dataframe
from app.models import AnalyticsSummary, WebhookAttemptIn, WebhookDecision
from app.sample_data import generate_sample_attempts
from app.storage import insert_attempt, load_attempts, replace_attempts

app = FastAPI(
    title="FailTrace API",
    description="Webhook reliability and replay decision engine backend v0.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "failtrace-api"}


@app.post("/seed")
def seed_sample_data(total_events: int = 80) -> dict[str, int | str]:
    df = generate_sample_attempts(total_events=total_events)
    SAMPLE_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(SAMPLE_CSV_PATH, index=False)
    inserted = replace_attempts(df)
    return {"inserted_attempts": inserted, "csv_path": str(SAMPLE_CSV_PATH)}


def _load_non_empty_attempts() -> pd.DataFrame:
    df = load_attempts()
    if df.empty:
        raise HTTPException(status_code=404, detail="No attempts loaded. Run POST /seed first.")
    return df


def _endpoint_url(endpoint_id: str) -> str:
    slug = endpoint_id.replace("ep_", "").replace("_", "-")
    return f"https://hooks.failtrace.dev/{slug}"


def _latest_event_rows(df: pd.DataFrame, limit: int) -> pd.DataFrame:
    ordered = df.sort_values(["created_at", "attempt_number"])
    return ordered.groupby("event_id", as_index=False).tail(1).tail(limit)


def _events_payload(limit: int = 100) -> list[dict[str, Any]]:
    attempts = _load_non_empty_attempts()
    decisions = analyze_dataframe(attempts)
    latest_attempts = _latest_event_rows(attempts, limit)
    latest_decisions = (
        decisions.drop_duplicates("event_id", keep="last")
        .set_index("event_id")
        .to_dict(orient="index")
    )

    events = []
    for _, attempt in latest_attempts.iterrows():
        decision = latest_decisions.get(attempt["event_id"], {})
        endpoint_attempts = attempts[attempts["endpoint_id"] == attempt["endpoint_id"]]
        event_attempts = attempts[attempts["event_id"] == attempt["event_id"]]
        success_rate = float(endpoint_attempts["status_code"].between(200, 299).mean())
        events.append(
            {
                "event_id": attempt["event_id"],
                "endpoint_id": attempt["endpoint_id"],
                "endpoint_url": _endpoint_url(attempt["endpoint_id"]),
                "status_code": int(attempt["status_code"]),
                "retry_count": int(max(0, event_attempts["attempt_number"].max() - 1)),
                "delivery_state": decision.get("delivery_state", "unknown"),
                "failure_reason": decision.get("failure_reason", "none"),
                "safe_to_replay": bool(decision.get("safe_to_replay", False)),
                "recommended_action": decision.get("recommended_action", "No Action"),
                "endpoint_health_score": int(decision.get("endpoint_health_score", round(success_rate * 100))),
                "replay_confidence_score": int(decision.get("replay_confidence_score", 0)),
                "created_at": attempt["created_at"],
                "attempts": event_attempts.sort_values("attempt_number").to_dict(orient="records"),
                "explanation": decision.get("explanation", []),
                "features": decision.get("features", {}),
            }
        )
    return events


@app.get("/attempts")
def list_attempts(limit: int = 100) -> list[dict]:
    df = _load_non_empty_attempts()
    return df.tail(limit).to_dict(orient="records")


@app.post("/analyze", response_model=WebhookDecision)
def analyze_single_attempt(payload: dict[str, Any] = Body(...)) -> WebhookDecision:
    history = _load_non_empty_attempts()
    if set(payload.keys()) == {"event_id"}:
        event_rows = history[history["event_id"] == payload["event_id"]]
        if event_rows.empty:
            raise HTTPException(status_code=404, detail=f"Event {payload['event_id']} was not found.")
        latest = event_rows.sort_values(["created_at", "attempt_number"]).iloc[-1].to_dict()
        attempt = WebhookAttemptIn(**latest)
        return analyze_attempt(attempt, history)

    attempt = WebhookAttemptIn(**payload)
    decision = analyze_attempt(attempt, history)
    row = attempt.model_dump()
    if row["created_at"] is None:
        row["created_at"] = "manual"
    insert_attempt(row)
    return decision


@app.get("/decisions")
def list_decisions(limit: int = 100) -> list[dict]:
    df = _load_non_empty_attempts()
    decisions = analyze_dataframe(df).tail(limit)
    return decisions.to_dict(orient="records")


@app.get("/events")
def list_events(limit: int = 100) -> list[dict[str, Any]]:
    return _events_payload(limit)


@app.get("/events/{event_id}")
def get_event(event_id: str) -> dict[str, Any]:
    for event in _events_payload(500):
        if event["event_id"] == event_id:
            return event
    raise HTTPException(status_code=404, detail=f"Event {event_id} was not found.")


@app.get("/endpoints")
def list_endpoints() -> list[dict[str, Any]]:
    attempts = _load_non_empty_attempts()
    decisions = analyze_dataframe(attempts)
    latest_decisions = decisions.drop_duplicates("event_id", keep="last")
    endpoints = []

    for endpoint_id, group in attempts.groupby("endpoint_id"):
        endpoint_decisions = latest_decisions[latest_decisions["endpoint_id"] == endpoint_id]
        total = group["event_id"].nunique()
        failed = group[~group["status_code"].between(200, 299)]["event_id"].nunique()
        health = (
            int(round(endpoint_decisions["endpoint_health_score"].mean()))
            if not endpoint_decisions.empty
            else int(round(group["status_code"].between(200, 299).mean() * 100))
        )
        history = []
        for _, row in group.sort_values(["created_at", "attempt_number"]).iterrows():
            decision = endpoint_decisions[endpoint_decisions["event_id"] == row["event_id"]]
            history.append(
                {
                    "event_id": row["event_id"],
                    "created_at": row["created_at"],
                    "status_code": int(row["status_code"]),
                    "attempt_number": int(row["attempt_number"]),
                    "response_time_ms": int(row["response_time_ms"]),
                    "health_score": int(decision.iloc[-1]["endpoint_health_score"]) if not decision.empty else health,
                    "delivery_state": str(decision.iloc[-1]["delivery_state"]) if not decision.empty else "unknown",
                }
            )
        endpoints.append(
            {
                "endpoint_id": endpoint_id,
                "endpoint_url": _endpoint_url(endpoint_id),
                "avg_health_score": health,
                "total_events": int(total),
                "failure_rate": round((failed / max(1, total)) * 100, 1),
                "last_seen": str(group["created_at"].max()),
                "event_history": history,
                "score_trend": [
                    {"time": item["created_at"], "score": item["health_score"]}
                    for item in history[-20:]
                ],
            }
        )
    return sorted(endpoints, key=lambda item: item["avg_health_score"])


@app.get("/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary() -> AnalyticsSummary:
    df = _load_non_empty_attempts()
    decisions = analyze_dataframe(df)
    return AnalyticsSummary(
        total_attempts=len(df),
        delivery_state_counts=decisions["delivery_state"].value_counts().to_dict(),
        failure_reason_counts=decisions["failure_reason"].value_counts().to_dict(),
        recommended_action_counts=decisions["recommended_action"].value_counts().to_dict(),
        average_endpoint_health_score=round(decisions["endpoint_health_score"].mean(), 2),
        average_replay_confidence_score=round(decisions["replay_confidence_score"].mean(), 2),
    )
