from __future__ import annotations

from fastapi import FastAPI, HTTPException
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


@app.get("/attempts")
def list_attempts(limit: int = 100) -> list[dict]:
    df = load_attempts()
    if df.empty:
        raise HTTPException(status_code=404, detail="No attempts loaded. Run POST /seed first.")
    return df.tail(limit).to_dict(orient="records")


@app.post("/analyze", response_model=WebhookDecision)
def analyze_single_attempt(attempt: WebhookAttemptIn) -> WebhookDecision:
    history = load_attempts()
    decision = analyze_attempt(attempt, history)
    row = attempt.model_dump()
    if row["created_at"] is None:
        row["created_at"] = "manual"
    insert_attempt(row)
    return decision


@app.get("/decisions")
def list_decisions(limit: int = 100) -> list[dict]:
    df = load_attempts()
    if df.empty:
        raise HTTPException(status_code=404, detail="No attempts loaded. Run POST /seed first.")
    decisions = analyze_dataframe(df).tail(limit)
    return decisions.to_dict(orient="records")


@app.get("/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary() -> AnalyticsSummary:
    df = load_attempts()
    if df.empty:
        raise HTTPException(status_code=404, detail="No attempts loaded. Run POST /seed first.")
    decisions = analyze_dataframe(df)
    return AnalyticsSummary(
        total_attempts=len(df),
        delivery_state_counts=decisions["delivery_state"].value_counts().to_dict(),
        failure_reason_counts=decisions["failure_reason"].value_counts().to_dict(),
        recommended_action_counts=decisions["recommended_action"].value_counts().to_dict(),
        average_endpoint_health_score=round(decisions["endpoint_health_score"].mean(), 2),
        average_replay_confidence_score=round(decisions["replay_confidence_score"].mean(), 2),
    )
