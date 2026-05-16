from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd

from app.config import DATABASE_PATH


SCHEMA = """
CREATE TABLE IF NOT EXISTS webhook_attempts (
    event_id TEXT NOT NULL,
    endpoint_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    payload_size_kb REAL NOT NULL,
    signature_valid INTEGER NOT NULL,
    endpoint_active INTEGER NOT NULL,
    duplicate_event INTEGER NOT NULL,
    replay_count INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
"""


def connect(db_path: Path = DATABASE_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute(SCHEMA)
    return conn


def load_attempts(db_path: Path = DATABASE_PATH) -> pd.DataFrame:
    with connect(db_path) as conn:
        return pd.read_sql_query("SELECT * FROM webhook_attempts ORDER BY created_at", conn)


def replace_attempts(df: pd.DataFrame, db_path: Path = DATABASE_PATH) -> int:
    with connect(db_path) as conn:
        conn.execute("DELETE FROM webhook_attempts")
        df.to_sql("webhook_attempts", conn, if_exists="append", index=False)
    return len(df)


def insert_attempt(row: dict, db_path: Path = DATABASE_PATH) -> None:
    fields = [
        "event_id",
        "endpoint_id",
        "attempt_number",
        "status_code",
        "response_time_ms",
        "payload_size_kb",
        "signature_valid",
        "endpoint_active",
        "duplicate_event",
        "replay_count",
        "created_at",
    ]
    values = [row[field] for field in fields]
    placeholders = ",".join(["?"] * len(fields))
    with connect(db_path) as conn:
        conn.execute(
            f"INSERT INTO webhook_attempts ({','.join(fields)}) VALUES ({placeholders})",
            values,
        )
