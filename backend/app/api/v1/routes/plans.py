from __future__ import annotations

import uuid
from datetime import datetime
from typing import Generator, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.plan import Plan as PlanModel
from app.db.models.plan_leg import PlanLeg as PlanLegModel
from app.schemas.plans import PlanCreate, PlanOut, PlanSummary, PlanLeg
from app.services.delay_client import predict_delay
from datetime import datetime

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
    # summary is optional at this stage; you can compute later
    summary = None
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



# ---------- POST /plans ----------
@router.post("", response_model=PlanOut, status_code=201)
async def create_plan(payload: PlanCreate, db: Session = Depends(get_db)):
    """
    Create a 'draft' plan and stash the requested shipment_ids in details_json.
    Legs will be added later by the optimiser.
    """
    if not payload.shipment_ids:
        raise HTTPException(status_code=400, detail="shipment_ids cannot be empty")

    plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    plan = PlanModel(
        id=plan_id,
        status="draft",
        created_at=datetime.utcnow(),
        details_json={"shipment_ids": payload.shipment_ids, "objective": payload.objective, "modes": payload.modes, "constraints": payload.constraints},
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
        # ---------------- Delay ML integration ----------------
    now = datetime.utcnow()

    # TEMP / AGGREGATED values (acceptable for Sem-1)
    total_weight_kg = 0.0      # replace with real aggregation later
    avg_priority = 2           # simple default

    # TEMP stubs (until traffic/weather services wired)
    traffic = {
        "congestion_index": 0.6,
        "avg_speed_kph": 30.0,
    }

    weather = {
        "temperature_c": 30.0,
        "precipitation_mm": 1.0,
        "wind_speed_mps": 4.0,
    }

    delay_features = {
        "distance_km": plan.total_distance_km or 0.0,
        "baseline_time_min": plan.total_time_min or 0.0,
        "weight_kg": total_weight_kg,
        "priority": avg_priority,
        "hour_of_day": now.hour,
        "day_of_week": now.weekday(),
        "temperature_c": weather["temperature_c"],
        "precipitation_mm": weather["precipitation_mm"],
        "wind_speed_mps": weather["wind_speed_mps"],
        "congestion_index": traffic["congestion_index"],
        "avg_speed_kph": traffic["avg_speed_kph"],
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
