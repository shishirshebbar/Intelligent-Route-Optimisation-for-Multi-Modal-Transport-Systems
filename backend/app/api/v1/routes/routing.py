from __future__ import annotations

from math import radians, sin, cos, asin, sqrt
from typing import Annotated, Generator, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.mode_params import MODE_PARAMS
from app.services.osrm_client import OSRMCoor, route as osrm_route

router = APIRouter(tags=["routing"], prefix="/routing")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
    depart_after: Optional[str] = None


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
    polyline: Optional[str] = None
    source: str = "heuristic"


class DynamicKpiOut(BaseModel):
    delay_reduction_pct: float
    emissions_saved_pct: float
    cost_change_pct: float


class RouteOut(BaseModel):
    distance_km: float
    time_min: float
    co2e_kg: float
    legs: list[RouteLegOut]
    kpis: DynamicKpiOut
    source: str = "heuristic"


_CO2E_PER_KM = {
    "road": MODE_PARAMS["road"]["emission_kg_per_km"],
    "rail": MODE_PARAMS["rail"]["emission_kg_per_km"],
    "sea": MODE_PARAMS["sea"]["emission_kg_per_km"],
    "air": MODE_PARAMS["air"]["emission_kg_per_km"],
    "transfer": 0.0,
}


def haversine_km(a: Coord, b: Coord) -> float:
    earth_radius_km = 6371.0
    lat1, lon1, lat2, lon2 = map(radians, [a.lat, a.lon, b.lat, b.lon])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(h))


async def _compute_road_metrics(origin: Coord, dest: Coord) -> tuple[float, float, Optional[str], str]:
    try:
        data = await osrm_route(
            [OSRMCoor(lat=origin.lat, lon=origin.lon), OSRMCoor(lat=dest.lat, lon=dest.lon)]
        )
        routes = data.get("routes") or []
        if routes:
            best = routes[0]
            distance_km = float(best.get("distance", 0.0)) / 1000.0
            time_min = float(best.get("duration", 0.0)) / 60.0
            polyline = best.get("geometry")
            if distance_km > 0 and time_min > 0:
                return distance_km, time_min, polyline, "osrm"
    except Exception:
        pass

    distance_km = haversine_km(origin, dest)
    time_min = (distance_km / MODE_PARAMS["road"]["speed_kph"]) * 60.0
    return distance_km, time_min, None, "heuristic"


async def _compute_mode_leg(mode: Mode, origin: Coord, dest: Coord) -> RouteLegOut:
    if mode == "road":
        distance_km, time_min, polyline, source = await _compute_road_metrics(origin, dest)
    else:
        params = MODE_PARAMS.get(mode)
        if params is None:
            raise HTTPException(status_code=400, detail=f"Unsupported mode: {mode}")
        distance_km = haversine_km(origin, dest)
        time_min = (distance_km / params["speed_kph"]) * 60.0 + params["transfer_penalty_min"]
        polyline = None
        source = "heuristic"

    return RouteLegOut(
        mode=mode,
        from_coord=origin,
        to_coord=dest,
        distance_km=round(distance_km, 3),
        time_min=round(time_min, 1),
        co2e_kg=round(distance_km * _CO2E_PER_KM.get(mode, 0.0), 3),
        polyline=polyline,
        source=source,
    )


@router.post("/multimodal", response_model=RouteOut)
async def compute_multimodal_route(payload: RoutingRequest, db: Session = Depends(get_db)):
    if not payload.modes:
        raise HTTPException(status_code=400, detail="At least one mode is required")

    origin = payload.origins[0]
    dest = payload.destinations[0]
    mode = payload.modes[0]

    leg = await _compute_mode_leg(mode, origin, dest)
    baseline_leg = await _compute_mode_leg("road", origin, dest)

    base_cost = baseline_leg.distance_km * MODE_PARAMS["road"]["cost_per_km"]
    mode_params = MODE_PARAMS.get(mode, MODE_PARAMS["road"])
    opt_cost = leg.distance_km * mode_params["cost_per_km"]
    base_delay = baseline_leg.time_min * 0.35
    opt_delay = leg.time_min * (0.15 if mode == "road" else 0.12)

    kpis = DynamicKpiOut(
        delay_reduction_pct=round((base_delay - opt_delay) / max(1.0, base_delay) * 100, 2),
        emissions_saved_pct=round(
            (baseline_leg.co2e_kg - leg.co2e_kg) / max(1.0, baseline_leg.co2e_kg) * 100,
            2,
        ),
        cost_change_pct=round((opt_cost - base_cost) / max(1.0, base_cost) * 100, 2),
    )

    return RouteOut(
        distance_km=leg.distance_km,
        time_min=leg.time_min,
        co2e_kg=leg.co2e_kg,
        legs=[leg],
        kpis=kpis,
        source=leg.source,
    )
