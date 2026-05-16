import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.config import SAMPLE_CSV_PATH
from app.sample_data import generate_sample_attempts
from app.storage import replace_attempts


def main() -> None:
    df = generate_sample_attempts(total_events=100)
    SAMPLE_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(SAMPLE_CSV_PATH, index=False)
    inserted = replace_attempts(df)
    print(f"Generated {inserted} attempts")
    print(f"CSV: {SAMPLE_CSV_PATH}")


if __name__ == "__main__":
    main()
