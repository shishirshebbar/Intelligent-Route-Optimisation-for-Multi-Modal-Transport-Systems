from __future__ import annotations

import os
import httpx
from pydantic import BaseModel

OSRM_URL = os.getenv("OSRM_URL", "http://localhost:5000")

class OSRMCoor(BaseModel):
    lat: float
    lon: float

async def route(coords: list[OSRMCoor], profile: str = "car") -> dict:
    """
    Call OSRM /route when you enable it.
    coords: [OSRMCoor(...), OSRMCoor(...)]
    profile: car|bike|foot (OSRM profiles)
    """
    if len(coords) < 2:
        raise ValueError("At least two coordinates required")

    path = ";".join([f"{c.lon},{c.lat}" for c in coords])
    url = f"{OSRM_URL}/route/v1/{profile}/{path}"
    params = {
        "overview": "full",
        "geometries": "polyline",
        "annotations": "distance,duration",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()
