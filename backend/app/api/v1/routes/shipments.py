from __future__ import annotations

from datetime import datetime
from typing import Generator, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.shipment import Shipment as ShipmentModel
from app.schemas.shipments import (
    ShipmentIn,
    ShipmentOut,
    BulkShipmentIn,
    ShipmentListResponse,
)

router = APIRouter(tags=["shipments"], prefix="/shipments")


# ---------- DB session dependency ----------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Helpers ----------
def _to_shipment_out(m: ShipmentModel) -> ShipmentOut:
    return ShipmentOut(
        id=m.id,
        origin_id=m.origin_id,
        destination_id=m.destination_id,
        volume_m3=float(m.volume_m3),
        weight_kg=float(m.weight_kg),
        ready_time=m.ready_time,
        due_time=m.due_time,
        priority=int(m.priority) if m.priority is not None else 0,
    )


# ---------- GET /shipments ----------
@router.get("", response_model=ShipmentListResponse)
def list_shipments(
    due_before: Optional[datetime] = Query(None),
    priority: Optional[int] = Query(None, ge=0),
    db: Session = Depends(get_db),
):
    """
    Basic list with optional filters:
      - due_before: ISO datetime (returns shipments due on or before this)
      - priority: integer match
    """
    conditions = []
    if due_before is not None:
        conditions.append(ShipmentModel.due_time <= due_before)
    if priority is not None:
        conditions.append(ShipmentModel.priority == priority)

    stmt = select(ShipmentModel)
    if conditions:
        stmt = stmt.where(and_(*conditions))

    rows: List[ShipmentModel] = db.execute(stmt).scalars().all()
    data = [_to_shipment_out(r) for r in rows]
    return ShipmentListResponse(data=data, total=len(data))


# ---------- POST /shipments (single OR bulk) ----------
class CreateResult(BaseModel):
    created: List[str]
    duplicates: List[str]
    data: List[ShipmentOut]


@router.post("", response_model=Union[ShipmentOut, CreateResult], status_code=201)
def create_shipments(
    payload: Union[ShipmentIn, BulkShipmentIn],
    db: Session = Depends(get_db),
):
    """
    Accepts:
      - Single: ShipmentIn
      - Bulk: { "shipments": [ShipmentIn, ...] }

    Returns:
      - Single: ShipmentOut (201)
      - Bulk: { created: [...], duplicates: [...], data: [ShipmentOut, ...] } (201)
    """
    # Normalize to a list of ShipmentIn
    if isinstance(payload, ShipmentIn):
        items = [payload]
        single_mode = True
    else:
        items = payload.shipments
        single_mode = False

    # Pre-check duplicates (by id) to avoid IntegrityError noise
    incoming_ids = [s.id for s in items]
    if incoming_ids:
        existing_ids = (
            db.execute(
                select(ShipmentModel.id).where(ShipmentModel.id.in_(incoming_ids))
            )
            .scalars()
            .all()
        )
    else:
        existing_ids = []

    to_insert = [s for s in items if s.id not in set(existing_ids)]
    created_ids: List[str] = []
    created_models: List[ShipmentModel] = []

    # Insert new rows
    for s in to_insert:
        m = ShipmentModel(
            id=s.id,
            origin_id=s.origin_id,
            destination_id=s.destination_id,
            volume_m3=s.volume_m3,
            weight_kg=s.weight_kg,
            ready_time=s.ready_time,
            due_time=s.due_time,
            priority=s.priority if s.priority is not None else 0,
        )
        db.add(m)
        created_models.append(m)
        created_ids.append(s.id)

    # Commit once
    try:
        if created_models:
            db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Conflict while inserting: {e.orig}")

    # Fetch rows for response (both newly created and pre-existing duplicates)
    final_ids = created_ids + existing_ids
    if not final_ids:
        # no payload at all
        raise HTTPException(status_code=400, detail="No shipments provided")

    rows = (
        db.execute(select(ShipmentModel).where(ShipmentModel.id.in_(final_ids)))
        .scalars()
        .all()
    )
    data_out = [_to_shipment_out(r) for r in rows]

    if single_mode:
        # Return the single object (created or existing)
        # Prefer returning the exact record by the single id
        wanted = payload.id
        obj = next((d for d in data_out if d.id == wanted), None)
        if obj is None:
            raise HTTPException(status_code=500, detail="Unexpected: inserted row not found")
        return obj

    # Bulk mode: created + duplicates + data
    duplicates = [sid for sid in incoming_ids if sid in set(existing_ids)]
    return CreateResult(created=created_ids, duplicates=duplicates, data=data_out)
