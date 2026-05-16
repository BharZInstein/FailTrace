from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "failtrace.db"
SAMPLE_CSV_PATH = DATA_DIR / "generated_webhook_deliveries.csv"
