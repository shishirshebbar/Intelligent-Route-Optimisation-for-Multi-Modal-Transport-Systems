from typing import Dict, Any
from datetime import datetime, timezone


def adapt_to_ml_payload(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adapt and validate features for ML DelayRequest schema.
    Prevents 422 errors from strict FastAPI validation.
    """

    now = datetime.now(timezone.utc)

    # ---- Required fields with safe defaults ----
    payload = {
        "distance_km": max(1.0, float(features.get("distance_km", 1.0))),

        "baseline_time_min": max(1.0, float(features.get("baseline_time_min", 30.0))),
        "weight_kg": max(1.0, float(features.get("weight_kg", 500.0))),
        "priority": int(min(3, max(1, features.get("priority", 2)))),
        "hour_of_day": int(features.get("hour_of_day", now.hour)),
        "day_of_week": int(features.get("day_of_week", now.weekday())),
        "temperature_c": float(features.get("temperature_c", 25.0)),
        "precipitation_mm": max(0.0, float(features.get("precipitation_mm", 0.0))),
        "wind_speed_mps": max(0.0, float(features.get("wind_speed_mps", 2.0))),
        "congestion_index": min(1.0, max(0.0, float(features.get("congestion_index", 0.4)))),
        "avg_speed_kph": max(1.0, float(features.get("avg_speed_kph", 35.0))),
    }

    return payload
