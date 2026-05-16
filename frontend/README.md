# Adaptive Webhook Reliability & Replay Intelligence System

Modern observability dashboard focused on webhook reliability, replay safety, endpoint health, failure fingerprinting, and adaptive retry optimization. Built for a production-grade demo experience with a dark, analytics-first UI.

## Features

- Failure pattern detection and retry fingerprints
- Endpoint health scoring with gauges and trends
- Replay confidence scoring with safe/unsafe risk indicators
- Event explorer with search, filter, and replay risk sorting
- Retry timeline visualization and event detail intelligence
- RL-based retry optimization recommendations

## Tech Stack

- Next.js App Router
- Tailwind CSS
- Recharts
- Axios
- TypeScript

## Routes

- `/overview` — overview dashboard
- `/events` — event explorer
- `/events/[id]` — event detail view
- `/retry-timeline` — retry timeline visualization
- `/endpoints` — endpoint health monitoring
- `/fingerprints` — failure fingerprinting
- `/replay-intelligence` — replay intelligence
- `/rl-optimization` — RL retry optimization

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## API Integration

API services are defined in `src/services` and use Axios via `src/services/apiClient.ts` for these endpoints:

- `/events`
- `/event/:id`
- `/health`
- `/fingerprints`
- `/replay-analysis`
- `/recommendations`
- `/retry-optimizer`

Set `NEXT_PUBLIC_API_BASE_URL` to point to your FastAPI server.

### Mock Data Toggle

By default the UI uses mock responses that mirror expected backend payloads. Set:

```bash
NEXT_PUBLIC_USE_MOCK=false
```

to switch to live API calls. Mock responses live in `src/lib/mock-data.ts` and are consumed via `src/services/mock.ts`.
