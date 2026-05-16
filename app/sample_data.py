from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

import pandas as pd
from faker import Faker

fake = Faker()


def generate_sample_attempts(total_events: int = 80, seed: int = 7) -> pd.DataFrame:
    random.seed(seed)
    Faker.seed(seed)
    endpoints = [
        {"endpoint_id": "ep_billing_prod", "base_success": 0.86, "active": True},
        {"endpoint_id": "ep_crm_sync", "base_success": 0.72, "active": True},
        {"endpoint_id": "ep_legacy_erp", "base_success": 0.55, "active": True},
        {"endpoint_id": "ep_deleted_test", "base_success": 0.08, "active": False},
        {"endpoint_id": "ep_rate_limited_partner", "base_success": 0.62, "active": True},
    ]
    rows = []
    now = datetime.now(timezone.utc)

    for idx in range(total_events):
        endpoint = random.choice(endpoints)
        event_id = f"evt_{fake.unique.bothify(text='????##').lower()}"
        attempt_count = random.choices([1, 2, 3, 4, 5, 8], weights=[46, 22, 14, 9, 6, 3])[0]
        duplicate_event = random.random() < 0.06
        signature_valid = random.random() > (0.04 if endpoint["active"] else 0.18)
        replay_count = random.choices([0, 1, 2, 3, 4], weights=[72, 16, 7, 3, 2])[0]
        created_at = now - timedelta(minutes=(total_events - idx) * 11)

        delivered = False
        for attempt_number in range(1, attempt_count + 1):
            if duplicate_event:
                status_code = 200
                response_time_ms = random.randint(80, 650)
            elif not endpoint["active"]:
                status_code = random.choice([404, 410, 503])
                response_time_ms = random.randint(120, 900)
            elif not signature_valid:
                status_code = random.choice([400, 401, 403])
                response_time_ms = random.randint(60, 300)
            elif endpoint["endpoint_id"] == "ep_rate_limited_partner" and random.random() < 0.35:
                status_code = 429
                response_time_ms = random.randint(100, 550)
            elif random.random() < endpoint["base_success"] + (attempt_number * 0.04):
                status_code = random.choice([200, 200, 201, 204])
                response_time_ms = random.randint(70, 1_200)
                delivered = True
            else:
                status_code = random.choice([408, 422, 500, 502, 503, 504])
                response_time_ms = random.choice([random.randint(600, 2_500), random.randint(8_000, 15_000)])

            rows.append(
                {
                    "event_id": event_id,
                    "endpoint_id": endpoint["endpoint_id"],
                    "attempt_number": attempt_number,
                    "status_code": status_code,
                    "response_time_ms": response_time_ms,
                    "payload_size_kb": round(random.uniform(0.8, 128.0), 2),
                    "signature_valid": signature_valid,
                    "endpoint_active": endpoint["active"],
                    "duplicate_event": duplicate_event,
                    "replay_count": replay_count,
                    "created_at": (created_at + timedelta(minutes=attempt_number * 2)).isoformat(),
                }
            )
            if delivered:
                break

    return pd.DataFrame(rows)
