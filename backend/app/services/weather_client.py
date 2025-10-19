# backend/app/services/weather_client.py
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from pydantic import BaseModel, Field, ValidationError

# ---- Config ----
OPEN_METEO_BASE = os.getenv("OPEN_METEO_BASE", "https://api.open-meteo.com/v1/forecast")
HTTP_TIMEOUT_S = float(os.getenv("WEATHER_HTTP_TIMEOUT", "10"))

# Default "current" variables to request (Open-Meteo supports comma-separated list)
DEFAULT_CURRENT_VARS = os.getenv(
    "WEATHER_CURRENT_VARS",
    "temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m"
)

class WeatherSnapshot(BaseModel):
    """Normalized weather snapshot for a single (lat, lon) at 'retrieved_at'."""
    lat: float
    lon: float
    temperature_c: Optional[float] = Field(None, description="Air temperature at 2m (°C)")
    precipitation_mm: Optional[float] = Field(None, description="Precip at snapshot (mm)")
    wind_speed_mps: Optional[float] = Field(None, description="10m wind (m/s)")
    relative_humidity_pct: Optional[float] = Field(None, ge=0, le=100)
    source: str = "open-meteo"
    retrieved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    raw: Dict[str, Any] = Field(default_factory=dict)

async def fetch_current_weather(
    lat: float,
    lon: float,
    current_vars: str = DEFAULT_CURRENT_VARS,
    tz: str = "UTC",
) -> WeatherSnapshot:
    """
    Call Open-Meteo for 'current' variables and return a normalized snapshot.
    - No API key required.
    - Flexible parsing: handles both modern 'current' and legacy 'current_weather' fields.
    """
    params = {
        "latitude": f"{lat:.6f}",
        "longitude": f"{lon:.6f}",
        "current": current_vars,             # new API style
        "timezone": tz,
    }

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_S) as client:
        r = await client.get(OPEN_METEO_BASE, params=params)
        r.raise_for_status()
        data = r.json()

    # Try new "current" object first
    current = data.get("current")
    if isinstance(current, dict):
        temp_c = _get_float(current, ["temperature_2m"])
        precip = _get_float(current, ["precipitation"])
        wind_mps = _get_float(current, ["wind_speed_10m", "wind_speed"])
        rh = _get_float(current, ["relative_humidity_2m", "relative_humidity"])
    else:
        # Fallback (older schema): "current_weather"
        cw = data.get("current_weather") or {}
        temp_c = _get_float(cw, ["temperature", "temperature_2m"])
        # Open-Meteo older "current_weather" doesn’t include precipitation/humidity directly
        precip = None
        rh = None
        # windspeed in km/h in older schema; convert to m/s if present
        wind_kmh = _get_float(cw, ["windspeed"])
        wind_mps = (wind_kmh / 3.6) if (wind_kmh is not None) else None

    try:
        snap = WeatherSnapshot(
            lat=lat,
            lon=lon,
            temperature_c=temp_c,
            precipitation_mm=precip,
            wind_speed_mps=wind_mps,
            relative_humidity_pct=rh,
            raw=data,
        )
    except ValidationError:
        # Ensure we always return *something*, even if upstream changes schema
        snap = WeatherSnapshot(
            lat=lat, lon=lon, temperature_c=temp_c, precipitation_mm=precip,
            wind_speed_mps=wind_mps, relative_humidity_pct=rh, raw={"fallback": data}
        )
    return snap


def _get_float(d: Dict[str, Any], keys: list[str]) -> Optional[float]:
    for k in keys:
        v = d.get(k)
        if v is None:
            continue
        try:
            return float(v)
        except (TypeError, ValueError):
            continue
    return None
