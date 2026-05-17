<img width="1271" height="699" alt="image" src="https://github.com/user-attachments/assets/e2a27944-9c60-4607-bd20-4c8c0220514c" />

## Run Locally

Backend:

```bash
cd /home/bharz76/devz/failtrace
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/generate_dataset.py
uvicorn api.main:app --reload
```

Frontend:

```bash
cd /home/bharz76/devz/failtrace/frontend
npm install
npm run dev
```

Open the frontend URL printed by Next.js, usually:

```text
http://localhost:3000
```

Backend API docs:

```text
http://127.0.0.1:8000/docs
```

The frontend uses live backend data from `http://localhost:8000`.

## Current Pages

- `/` - main reliability dashboard
- `/analyze` - event replay analyzer
- `/endpoints` - endpoint monitor with side-panel history

## Backend API

- `GET /health`
- `POST /seed`
- `GET /events`
- `GET /endpoints`
- `POST /analyze`
- `GET /attempts`
- `GET /decisions`
- `GET /analytics/summary`

The ML intelligence engine is used by `POST /analyze` for single-event replay scoring. Bulk dashboard views use fast deterministic scoring so page loads stay responsive.
