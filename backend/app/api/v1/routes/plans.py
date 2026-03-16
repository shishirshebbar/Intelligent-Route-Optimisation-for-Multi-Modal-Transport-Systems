from __future__ import annotations

import uuid
from datetime import datetime
from typing import Generator, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.location import Location as LocationModel
from app.db.models.plan import Plan as PlanModel
from app.db.models.plan_leg import PlanLeg as PlanLegModel
from app.db.models.shipment import Shipment as ShipmentModel
from app.schemas.plans import PlanCreate, PlanOut, PlanSummary, PlanLeg
from app.services.delay_client import predict_delay
from app.services.traffic_client import get_area_traffic
from app.services.weather_client import fetch_current_weather

router = APIRouter(tags=["plans"], prefix="/plans")

# ---------- DB session dependency ----------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- Helpers ----------
def _to_plan_out(plan: PlanModel, legs: List[PlanLegModel]) -> PlanOut:
    summary = None
    if plan.total_time_min is not None or plan.total_co2e_kg is not None:
        summary = PlanSummary(
            total_time_min=plan.total_time_min,
            total_co2e_kg=plan.total_co2e_kg,
            on_time_probability=None,
        )


    legs_out = [
        PlanLeg(
            leg_id=pl.leg_id,
            shipment_id=pl.shipment_id,
            mode=pl.mode,  # type: ignore[arg-type]
            from_id=pl.from_id,
            to_id=pl.to_id,
            distance_km=pl.distance_km,
            eta_start=pl.eta_start,
            eta_end=pl.eta_end,
            cost=pl.cost,
            co2e_kg=pl.co2e_kg,
            delay_min_pred=pl.delay_min_pred,
            uncertainty=pl.uncertainty,
        )
        for pl in legs
    ]

    return PlanOut(
        id=plan.id,
        status=plan.status,
        created_at=plan.created_at,

        # ✅ ADD THESE (match PlanOut schema)
        total_distance_km=plan.total_distance_km,
        total_time_min=plan.total_time_min,
        total_co2e_kg=plan.total_co2e_kg,

        summary=summary,
        legs=legs_out,
        delay_prob=plan.delay_prob,
        expected_delay_min=plan.expected_delay_min,
    )


async def _get_environment_features(db: Session, shipments: List[ShipmentModel]) -> dict:
    defaults = {
        "temperature_c": 25.0,
        "precipitation_mm": 0.0,
        "wind_speed_mps": 2.0,
        "congestion_index": 0.4,
        "avg_speed_kph": 35.0,
    }
    if not shipments:
        return defaults

    anchor_location = db.get(LocationModel, shipments[0].origin_id)
    if anchor_location is None:
        anchor_location = db.get(LocationModel, shipments[0].destination_id)
    if anchor_location is None:
        return defaults

    weather = {
        "temperature_c": defaults["temperature_c"],
        "precipitation_mm": defaults["precipitation_mm"],
        "wind_speed_mps": defaults["wind_speed_mps"],
    }
    try:
        snapshot = await fetch_current_weather(float(anchor_location.lat), float(anchor_location.lon))
        weather = {
            "temperature_c": snapshot.temperature_c if snapshot.temperature_c is not None else defaults["temperature_c"],
            "precipitation_mm": snapshot.precipitation_mm if snapshot.precipitation_mm is not None else defaults["precipitation_mm"],
            "wind_speed_mps": snapshot.wind_speed_mps if snapshot.wind_speed_mps is not None else defaults["wind_speed_mps"],
        }
    except Exception:
        pass

    traffic = get_area_traffic(
        lat=float(anchor_location.lat),
        lon=float(anchor_location.lon),
        rain_mm=weather["precipitation_mm"],
    )

    return {
        **weather,
        "congestion_index": traffic.congestion_index,
        "avg_speed_kph": traffic.avg_speed_kph,
    }



# ---------- POST /plans ----------
@router.post("", response_model=PlanOut, status_code=201)
async def create_plan(payload: PlanCreate, db: Session = Depends(get_db)):
    """
    Create a 'draft' plan and stash the requested shipment_ids in details_json.
    Legs will be added later by the optimiser.
    """
    if not payload.shipment_ids:
        raise HTTPException(status_code=400, detail="shipment_ids cannot be empty")

    shipments = (
        db.execute(
            select(ShipmentModel).where(ShipmentModel.id.in_(payload.shipment_ids))
        )
        .scalars()
        .all()
    )
    if not shipments:
        raise HTTPException(status_code=400, detail="No valid shipments found")

    found_ids = {shipment.id for shipment in shipments}
    missing_ids = [shipment_id for shipment_id in payload.shipment_ids if shipment_id not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown shipment_ids: {', '.join(missing_ids)}",
        )

    total_weight_kg = sum(float(shipment.weight_kg) for shipment in shipments)
    avg_priority = max(1, min(3, round(sum(int(shipment.priority or 0) for shipment in shipments) / len(shipments)) + 1))

    plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    plan = PlanModel(
        id=plan_id,
        status="active",
        created_at=datetime.utcnow(),
        total_distance_km=float(payload.total_distance_km or 0.0),
        total_time_min=float(payload.total_time_min or 0.0),
        total_co2e_kg=float(payload.total_co2e_kg or 0.0),
        details_json={
            "shipment_ids": payload.shipment_ids,
            "objective": payload.objective,
            "modes": payload.modes,
            "constraints": payload.constraints,
            "selected_mode": payload.selected_mode,
        },
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # ---------------- Delay ML integration ----------------
    now = datetime.utcnow()
    environment = await _get_environment_features(db, shipments)

    delay_features = {
        "distance_km": max(plan.total_distance_km or 0.0, 1.0),
        "baseline_time_min": max(plan.total_time_min or 0.0, 1.0),
        "weight_kg": total_weight_kg,
        "priority": avg_priority,
        "hour_of_day": now.hour,
        "day_of_week": now.weekday(),
        "temperature_c": environment["temperature_c"],
        "precipitation_mm": environment["precipitation_mm"],
        "wind_speed_mps": environment["wind_speed_mps"],
        "congestion_index": environment["congestion_index"],
        "avg_speed_kph": environment["avg_speed_kph"],
    }

    delay = await predict_delay(delay_features)

    plan.delay_prob = delay["delay_prob"]
    plan.expected_delay_min = delay["expected_delay_min"]

    db.commit()
    db.refresh(plan)
    # -----------------------------------------------------

    # No legs yet
    return _to_plan_out(plan, legs=[])

# ---------- GET /plans/{id} ----------
@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: str, db: Session = Depends(get_db)):
    plan = db.get(PlanModel, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="plan not found")

    legs = (
        db.execute(select(PlanLegModel).where(PlanLegModel.plan_id == plan_id))
        .scalars()
        .all()
    )
    return _to_plan_out(plan, legs)

# ---------- GET /plans (optional list) ----------
@router.get("", response_model=list[PlanOut])
def list_plans(
    status: Optional[str] = Query(None, description="draft|active|rerouted|completed|failed"),
    db: Session = Depends(get_db),
):
    stmt = select(PlanModel)
    if status:
        stmt = stmt.where(PlanModel.status == status)

    plans = db.execute(stmt).scalars().all()
    # for a lightweight list, don’t fetch legs; return empty lists
    return [_to_plan_out(p, legs=[]) for p in plans]
