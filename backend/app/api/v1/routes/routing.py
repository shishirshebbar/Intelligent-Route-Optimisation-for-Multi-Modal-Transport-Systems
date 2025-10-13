from __future__ import annotations

from math import radians, sin, cos, asin, sqrt
from typing import Generator, Literal, Optional, Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, conlist
from sqlalchemy.orm import Session

from app.db.session import SessionLocal

router = APIRouter(tags=["routing"], prefix="/routing")

# ---------- DB session dependency (kept for parity; not used yet) ----------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Schemas (local to routing for simplicity) ----------
Mode = Literal["road", "rail", "sea", "air", "transfer"]

class Coord(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)

class Objective(BaseModel):
    cost: float = 0.5
    time: float = 0.3
    co2e: float = 0.2

class Constraints(BaseModel):
    prefer_low_emission_within_pct: Optional[int] = 10
    depart_after: Optional[str] = None  # ISO string

class RoutingRequest(BaseModel):
    origins: Annotated[list[Coord], Field(min_length=1)]
    destinations: Annotated[list[Coord], Field(min_length=1)]
    modes: list[Mode] = ["road"]
    objective: Objective = Objective()
    constraints: Optional[Constraints] = None

class RouteLegOut(BaseModel):
    mode: Mode
    from_coord: Coord
    to_coord: Coord
    distance_km: float
    time_min: float
    co2e_kg: float
    polyline: Optional[str] = None  # will be filled by OSRM later

class RouteOut(BaseModel):
    distance_km: float
    time_min: float
    co2e_kg: float
    legs: list[RouteLegOut]


# ---------- Helpers ----------
_SPEED_KPH = {
    "road": 50.0,
    "rail": 80.0,
    "sea": 30.0,
    "air": 700.0,
    "transfer": 3.0,
}

_CO2E_PER_KM = {  # placeholder kg CO2e per vehicle-km (not per kg of cargo)
    "road": 0.85,
    "rail": 0.25,
    "sea": 0.15,
    "air": 2.5,
    "transfer": 0.0,
}

def haversine_km(a: Coord, b: Coord) -> float:
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(radians, [a.lat, a.lon, b.lat, b.lon])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(h))


# ---------- POST /routing/multimodal (stub) ----------
@router.post("/multimodal", response_model=RouteOut)
def compute_multimodal_route(payload: RoutingRequest, db: Session = Depends(get_db)):
    """
    Stub implementation:
      - Picks the FIRST origin and FIRST destination.
      - Computes straight-line distance with haversine.
      - Uses FIRST mode in payload.modes (default 'road') for speed/CO2e.
      - Returns a single leg with deterministic values.
    Later:
      - Replace with OSRM (services/osrm_client.py) to return real route & polyline.
    """
    if not payload.modes:
        raise HTTPException(status_code=400, detail="At least one mode is required")

    origin = payload.origins[0]
    dest = payload.destinations[0]
    mode = payload.modes[0]

    dist_km = haversine_km(origin, dest)
    speed = _SPEED_KPH.get(mode, 50.0)
    time_min = (dist_km / speed) * 60.0
    co2e = _CO2E_PER_KM.get(mode, 0.0) * dist_km

    leg = RouteLegOut(
        mode=mode,
        from_coord=origin,
        to_coord=dest,
        distance_km=round(dist_km, 3),
        time_min=round(time_min, 1),
        co2e_kg=round(co2e, 3),
        polyline=None,  # to be filled by OSRM later
    )

    return RouteOut(
        distance_km=leg.distance_km,
        time_min=leg.time_min,
        co2e_kg=leg.co2e_kg,
        legs=[leg],
    )
