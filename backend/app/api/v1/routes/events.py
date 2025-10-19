from __future__ import annotations

from datetime import datetime, timezone
from typing import Generator, List, Literal, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.event import Event as EventModel

router = APIRouter(tags=["events"], prefix="/events")

# ---------- DB session dependency ----------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- Schemas (decoupled from ORM) ----------
EventType = Literal["traffic", "weather", "fuel_price", "breakdown"]
Severity = Literal["low", "moderate", "high"]

class EventIn(BaseModel):
    type: EventType
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    plan_id: Optional[str] = Field(None, description="Optional plan context")
    source: Optional[str] = Field(None, description="Producer of the event, e.g., open-meteo")
    severity: Optional[Severity] = Field(None, description="low|moderate|high")
    payload: dict = Field(default_factory=dict, description="Arbitrary JSON payload")

class EventOut(BaseModel):
    id: int
    type: EventType
    ts: datetime
    plan_id: Optional[str] = None
    source: Optional[str] = None
    severity: Optional[Severity] = None
    payload: dict

# ---------- Helpers ----------
def _to_event_out(m: EventModel) -> EventOut:
    return EventOut(
        id=int(m.id),
        type=m.type,                  # type: ignore[arg-type]
        ts=m.ts,
        plan_id=m.plan_id,
        source=m.source,
        severity=(m.severity if m.severity in {"low", "moderate", "high"} else None),  # safe-cast
        payload=m.payload_json or {},
    )

# ---------- POST /events ----------
@router.post("", response_model=EventOut, status_code=201)
def create_event(payload: EventIn, db: Session = Depends(get_db)):
    """
    Ingest an external event affecting routing weights or KPIs.
    Examples:
      - traffic: { "edge_id": "E-9", "factor": 1.35, "note": "Accident on NH" }
      - weather: { "lat": 12.9, "lon": 77.6, "rain_mm": 3.2 }
      - fuel_price: { "region": "KA", "price_inr_per_l": 112.5 }
      - breakdown: { "vehicle_id": "V-7", "lat": 12.98, "lon": 77.61 }
    """
    m = EventModel(
        plan_id=payload.plan_id,
        type=payload.type,
        ts=payload.ts,
        source=payload.source,
        severity=payload.severity,
        payload_json=payload.payload,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_event_out(m)

# ---------- GET /events ----------
@router.get("", response_model=list[EventOut])
def list_events(
    type: Optional[EventType] = Query(None, description="Filter by event type"),
    since: Optional[datetime] = Query(None, description="Start time (inclusive)"),
    until: Optional[datetime] = Query(None, description="End time (exclusive)"),
    plan_id: Optional[str] = Query(None, description="Filter by plan id"),
    source: Optional[str] = Query(None, description="Filter by source (e.g., open-meteo)"),
    severity: Optional[Severity] = Query(None, description="Filter by severity"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    List events with optional filters:
      - type: traffic|weather|fuel_price|breakdown
      - since/until: time window
      - plan_id: scope events to a plan
      - source: producer (open-meteo, stub-traffic, etc.)
      - severity: low|moderate|high
      - limit: cap result size
    """
    stmt = select(EventModel)
    conds = []

    if type is not None:
        conds.append(EventModel.type == type)
    if plan_id:
        conds.append(EventModel.plan_id == plan_id)
    if since is not None:
        conds.append(EventModel.ts >= since)
    if until is not None:
        conds.append(EventModel.ts < until)
    if source:
        conds.append(EventModel.source == source)
    if severity:
        conds.append(EventModel.severity == severity)

    if conds:
        stmt = stmt.where(and_(*conds))

    stmt = stmt.order_by(EventModel.ts.desc()).limit(limit)
    rows: List[EventModel] = db.execute(stmt).scalars().all()
    return [_to_event_out(r) for r in rows]
