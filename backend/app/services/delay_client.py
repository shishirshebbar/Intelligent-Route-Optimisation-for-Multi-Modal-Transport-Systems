from __future__ import annotations

import os
from typing import Dict, Any
from xmlrpc import client
from app.services.delay_payload_adapter import adapt_to_ml_payload

import httpx

ML_DELAY_URL = os.getenv("ML_DELAY_URL", "").rstrip("/")
ML_DELAY_TIMEOUT = float(os.getenv("ML_DELAY_TIMEOUT", "5.0"))


class DelayClientError(Exception):
    pass


def _dummy_predict(features: Dict[str, Any]) -> Dict[str, float]:
    """
    Fallback prediction so the backend never breaks during demos.
    Used when ML service is not running.
    """
    congestion = float(features.get("congestion_index", 0.4))
    rain = float(features.get("precipitation_mm", 0.0))
    base_time = float(features.get("baseline_time_min", 30.0))

    delay_min = max(0.0, congestion * 20 + rain * 2)
    delay_prob = min(0.9, delay_min / max(1.0, base_time))

    return {
        "delay_prob": round(delay_prob, 3),
        "expected_delay_min": round(delay_min, 1),
        "model_version": "dummy_v0"
    }


from datetime import datetime, timezone

async def predict_delay(features: Dict[str, Any]) -> Dict[str, float]:
    """
    Predict delay for a single shipment/route.

    Returns:
    {
      delay_prob: float,
      expected_delay_min: float,
      model_version: str
    }
    """

    # ---- 🔒 Feature enrichment (prevents 422) ----
    now = datetime.now(timezone.utc)

    defaults = {
        "weight_kg": 500.0,
        "priority": 2,
        "hour_of_day": now.hour,
        "day_of_week": now.weekday(),
        "temperature_c": 25.0,
        "precipitation_mm": 0.0,
        "wind_speed_mps": 2.0,
        "congestion_index": 0.4,
        "avg_speed_kph": 35.0,
    }

    full_features = {**defaults, **features}

    if not ML_DELAY_URL:
        return _dummy_predict(full_features)

    url = f"{ML_DELAY_URL}/ml/predict_delay"

    try:
        async with httpx.AsyncClient(timeout=ML_DELAY_TIMEOUT) as client:
            payload = adapt_to_ml_payload(full_features)
            r = await client.post(url, json=payload)

            if r.status_code != 200:
                print("❌ ML STATUS:", r.status_code)
                print("❌ ML RESPONSE:", r.text)
                raise DelayClientError(f"ML returned {r.status_code}")

            data = r.json()

    except Exception:
        # hard fallback → never crash backend
        return _dummy_predict(full_features)

    if "delay_prob" not in data or "expected_delay_min" not in data:
        raise DelayClientError("Malformed ML delay response")

    return data

