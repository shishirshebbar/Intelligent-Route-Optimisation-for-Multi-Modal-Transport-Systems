from typing import List, Dict, Any
from datetime import datetime

from app.services.delay_client import predict_delay


async def build_delay_penalties(
    time_matrix: List[List[int]],
    dist_km: List[List[float]],
    avg_weight: float,
    avg_priority: int,
    weather: Dict[str, Any],
    traffic: Dict[str, Any],
) -> List[List[float]]:
    """
    Build delay penalties matrix using ML-1 predictions.
    

    penalty_ij =
        expected_delay_min
        + delay_prob * base_time_ij
    """

    n = len(time_matrix)
    penalties = [[0.0] * n for _ in range(n)]
    now = datetime.utcnow()

    for i in range(n):
        for j in range(n):
            if i == j:
                continue

            delay = await predict_delay({
                "distance_km": dist_km[i][j],
                "baseline_time_min": time_matrix[i][j],
                "weight_kg": avg_weight,
                "priority": avg_priority,
                "hour_of_day": now.hour,
                "day_of_week": now.weekday(),
                "temperature_c": weather["temperature_c"],
                "precipitation_mm": weather["precipitation_mm"],
                "wind_speed_mps": weather["wind_speed_mps"],
                "congestion_index": traffic["congestion_index"],
                "avg_speed_kph": traffic["avg_speed_kph"],
            })

            penalties[i][j] = (
                delay["expected_delay_min"]
                + delay["delay_prob"] * time_matrix[i][j]
            )

    return penalties
