# FailTrace

FailTrace is a webhook reliability and replay-decision dashboard built for operators who need more than raw delivery logs.

Instead of only showing failed webhook attempts, FailTrace classifies delivery state, identifies likely failure reasons, estimates replay confidence, scores endpoint health, and recommends the next operational action.

![FailTrace dashboard](https://github.com/user-attachments/assets/e2a27944-9c60-4607-bd20-4c8c0220514c)

## Live Demo

- Frontend: https://fail-trace.vercel.app
- Backend API: https://failtrace.onrender.com
- API docs: https://failtrace.onrender.com/docs

## What It Does

- Reliability dashboard for webhook delivery health
- Event analyzer for replay-safety decisions
- Endpoint monitor with health trends and event history
- Failure classification for signatures, timeouts, rate limits, deleted endpoints, malformed responses, and duplicates
- Replay confidence scoring with recommended actions
- LangGraph workflow for the replay-decision pipeline
- ML-assisted single-event analysis with deterministic guardrails

## Product Flow

### Dashboard

The main dashboard gives a fast operational view of webhook reliability:

- total observed events
- failed deliveries
- average endpoint health
- unsafe replay count
- recent event table
- retry distribution
- endpoint health chart

### Event Analyzer

The analyzer accepts an event ID and returns:

- delivery state
- failure reason
- safe-to-replay verdict
- recommended action
- endpoint health score
- replay confidence score
- plain-language explanation

### Endpoint Monitor

The endpoint view helps identify whether failures are isolated to one event or part of a broader endpoint issue:

- endpoint health score
- total events
- failure rate
- last seen timestamp
- score trend
- event history drawer

## Architecture

```text
Next.js frontend
        |
        | HTTP API
        v
FastAPI backend
        |
        | LangGraph decision workflow
        v
SQLite + generated webhook dataset
        |
        | optional single-event inference
        v
ML replay intelligence layer
```

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Recharts, Axios
- Backend: Python, FastAPI, Pandas, SQLite, Pydantic, LangGraph
- ML: scikit-learn, NumPy, joblib
- Deployment: Vercel frontend, Render backend

## Backend API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/seed` | Generate and load webhook sample data |
| `GET` | `/events` | List dashboard-ready event summaries |
| `GET` | `/events/{event_id}` | Fetch a single event summary |
| `GET` | `/endpoints` | List endpoint health monitors |
| `POST` | `/analyze` | Analyze an event or webhook attempt |
| `GET` | `/attempts` | List raw delivery attempts |
| `GET` | `/decisions` | List analyzed decision rows |
| `GET` | `/analytics/summary` | Aggregate reliability metrics |

## Deployment

### Frontend

The frontend is deployed on Vercel from the `frontend` directory.

Required environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://failtrace.onrender.com
```

### Backend

The backend is deployed on Render.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

Recommended environment variable:

```text
PYTHON_VERSION=3.12.8
```

## Run Locally

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/generate_dataset.py
uvicorn api.main:app --reload
```

Backend URLs:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

For a local backend, use:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Demo Script

1. Open the dashboard and show reliability metrics, recent events, retry distribution, and endpoint health.
2. Open the analyzer and submit an event ID such as `evt_pay_91k2`.
3. Explain the safe-to-replay verdict, failure reason, confidence score, and recommended action.
4. Open endpoints and inspect an endpoint history drawer.
5. Close by explaining that FailTrace turns webhook delivery logs into replay decisions.

## Status

FailTrace is a hackathon-ready full-stack demo with a deployed frontend, deployed FastAPI backend, live API contract, and ML-assisted replay intelligence path.
