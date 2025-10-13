from __future__ import annotations

import os
from typing import List, Dict, Any

import httpx

# ENV toggles:
# - If ML_DELAY_URL is set, we'll call that HTTP service (expected to expose /ml/predict_delay).
# - If not set, we'll return deterministic dummy predictions.

ML_DELAY_URL = os.getenv("ML_DELAY_URL", "").rstrip("/")
ML_DELAY_TIMEOUT = float(os.getenv("ML_DELAY_TIMEOUT", "5.0"))  # seconds


class DelayClientError(Exception):
    pass


def _dummy_predict(edge_features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deterministic fallback: compute a fake delay using simple heuristics so
    frontend & backend can integrate without the real ML service.
    """
    out = []
    for f in edge_features:
        # pull fields safely
        hist_ratio = float(f.get("hist_speed_ratio") or 1.0)
        rain = float(f.get("rain_mm") or 0.0)
        wind = float(f.get("wind_mps") or 0.0)
        distance = float(f.get("distance_km") or 1.0)

        # toy heuristic:
        base = max(0.0, (1.0 - hist_ratio) * 10.0)
        weather = min(15.0, rain * 1.2 + max(0.0, wind - 5.0) * 0.4)
        scale = max(0.5, min(3.0, distance / 5.0))
        delay = round((base + weather) * scale, 2)

        out.append({
            "edge_id": f.get("edge_id"),
            "delay_min": delay,
            "uncertainty": round(delay * 0.25, 2)
        })
    return out


async def predict_delays(edge_features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Public async API to get delay predictions.
    - If ML_DELAY_URL is configured, call the real ML service.
    - Otherwise, return deterministic dummy predictions.
    """
    if not edge_features:
        return []

    if not ML_DELAY_URL:
        return _dummy_predict(edge_features)

    url = f"{ML_DELAY_URL}/ml/predict_delay"
    payload = {"edge_features": edge_features}

    try:
        async with httpx.AsyncClient(timeout=ML_DELAY_TIMEOUT) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        # fallback to dummy so the app never breaks during demos
        return _dummy_predict(edge_features)

    pred = data.get("pred")
    if not isinstance(pred, list):
        raise DelayClientError("Malformed ML response: missing 'pred' array")
    return pred
