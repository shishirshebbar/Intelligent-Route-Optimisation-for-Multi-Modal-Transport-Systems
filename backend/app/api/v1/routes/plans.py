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
    if plan.total_cost is not None or plan.total_time_min is not None or plan.total_co2e_kg is not None:
        summary = PlanSummary(
            total_cost=plan.total_cost,
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
        status=plan.status,  # type: ignore[arg-type]
        created_at=plan.created_at,
        summary=summary,
        legs=legs_out,
    )

# ---------- POST /plans ----------
@router.post("", response_model=PlanOut, status_code=201)
def create_plan(payload: PlanCreate, db: Session = Depends(get_db)):
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
