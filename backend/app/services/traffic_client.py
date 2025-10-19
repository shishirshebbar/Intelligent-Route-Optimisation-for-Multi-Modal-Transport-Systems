# backend/app/services/traffic_client.py
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

@dataclass
class TrafficSnapshot:
    """Simple, deterministic traffic snapshot."""
    lat: float
    lon: float
    ts: datetime
    congestion_index: float   # 0.0 (free) .. 1.0 (jam)
    avg_speed_kph: float      # estimated average road speed
    source: str = "stub-traffic"

def _time_of_day_minutes(ts: Optional[datetime] = None) -> int:
    ts = ts or datetime.now(timezone.utc)
    return ts.hour * 60 + ts.minute

def _weekday(ts: Optional[datetime] = None) -> int:
    ts = ts or datetime.now(timezone.utc)
    return ts.weekday()  # Monday=0..Sunday=6

def _peak_curve(minutes: int) -> float:
    """
    Produce morning & evening peaks using a smooth sinusoid blend.
    Returns 0..1
    - Morning peak around ~9:00
    - Evening peak around ~18:00
    """
    # Map minutes to radians for two peaks/day
    x = (minutes / (24 * 60)) * 2 * math.pi
    # two-period sine -> peaks near morning/evening
    val = (math.sin(2 * x - 0.5) + math.sin(2 * x + 1.0)) / 2.0
    # normalize to 0..1
    return (val + 1) / 2

def _weekday_modifier(weekday: int) -> float:
    """Slightly higher congestion Mon–Fri, lower on weekends."""
    if weekday < 5:   # Mon-Fri
        return 1.0
    # Weekend
    return 0.7

def _weather_modifier(rain_mm: float | None) -> float:
    """Rain increases congestion and reduces speed."""
    if not rain_mm or rain_mm <= 0:
        return 1.0
    # Cap rain effect
    return min(1.0 + (rain_mm * 0.08), 1.4)

def get_area_traffic(
    lat: float,
    lon: float,
    ts: Optional[datetime] = None,
    rain_mm: Optional[float] = None,
    freeflow_speed_kph: float = 50.0,
) -> TrafficSnapshot:
    """
    Deterministic area-level traffic estimate.
    Use this for:
      - Generating traffic 'events'
      - Adjusting ETA heuristics until real data is plugged in
    """
    ts = ts or datetime.now(timezone.utc)
    minutes = _time_of_day_minutes(ts)
    wk = _weekday(ts)

    peak = _peak_curve(minutes)                # 0..1
    weekday_mod = _weekday_modifier(wk)        # ~0.7..1.0
    weather_mod = _weather_modifier(rain_mm or 0.0)  # 1.0..1.4

    # Base congestion from time of day + weekday
    base_cong = peak * 0.75 * weekday_mod      # cap base at 0.75 typically

    # Weather pushes congestion up (capped at 1.0)
    congestion = min(1.0, base_cong * weather_mod)

    # Convert congestion to speed (simple linear map)
    # 0.0 congestion → freeflow, 1.0 congestion → 25% of freeflow
    speed_kph = max(5.0, freeflow_speed_kph * (0.25 + 0.75 * (1.0 - congestion)))

    return TrafficSnapshot(
        lat=lat,
        lon=lon,
        ts=ts,
        congestion_index=round(congestion, 3),
        avg_speed_kph=round(speed_kph, 1),
    )

def get_edge_factor(
    edge_id: str,
    base_travel_time_min: float,
    lat: float,
    lon: float,
    ts: Optional[datetime] = None,
    rain_mm: Optional[float] = None,
) -> dict:
    """
    Edge-level factor you can apply to an ETA or cost function.
    Returns a dict suitable for `events` payloads or VRP penalties.

    Example usage:
    factor = get_edge_factor("E-123", 10.0, 12.97, 77.59)
    # => {'edge_id': 'E-123', 'factor': 1.18, 'delta_min': 1.8, 'note': '...'}
    """
    snap = get_area_traffic(lat=lat, lon=lon, ts=ts, rain_mm=rain_mm)
    # Convert congestion (0..1) to multiplicative factor (1.0.. ~1.6)
    factor = 1.0 + snap.congestion_index * 0.6
    delta_min = max(0.0, (factor - 1.0) * base_travel_time_min)

    note = f"congestion={snap.congestion_index}, speed~{snap.avg_speed_kph}kph"
    if rain_mm and rain_mm > 0:
        note += f", rain={rain_mm}mm"

    return {
        "edge_id": edge_id,
        "factor": round(factor, 3),
        "delta_min": round(delta_min, 2),
        "congestion_index": snap.congestion_index,
        "avg_speed_kph": snap.avg_speed_kph,
        "note": note,
        "ts": snap.ts.isoformat(),
        "source": "stub-traffic",
    }
