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
http://localhost:3000/overview
```

Backend API docs:

```text
http://127.0.0.1:8000/docs
```

The frontend defaults to live backend data. Set `NEXT_PUBLIC_USE_MOCK=true` only if you want the frontend mock dataset again.
