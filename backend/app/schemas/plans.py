from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

PlanStatus = Literal["draft", "active", "rerouted", "completed", "failed"]
LegMode = Literal["road", "rail", "sea", "air", "transfer"]

class PlanCreate(BaseModel):
    shipment_ids: list[str] = Field(..., min_length=1)
    # optional knobs you may add later
    objective: Optional[dict] = None
    modes: Optional[list[LegMode]] = None
    constraints: Optional[dict] = None

class PlanSummary(BaseModel):
    total_cost: Optional[float] = None
    total_time_min: Optional[int] = None
    total_co2e_kg: Optional[float] = None
    on_time_probability: Optional[float] = Field(None, ge=0, le=1)

class PlanLeg(BaseModel):
    leg_id: str
    shipment_id: Optional[str] = None
    mode: LegMode
    from_id: Optional[int] = None
    to_id: Optional[int] = None
    distance_km: Optional[float] = None
    eta_start: Optional[datetime] = None
    eta_end: Optional[datetime] = None
    cost: Optional[float] = None
    co2e_kg: Optional[float] = None
    delay_min_pred: Optional[float] = None
    uncertainty: Optional[float] = None

class PlanOut(BaseModel):
    id: str
    status: PlanStatus
    created_at: Optional[datetime] = None
    summary: Optional[PlanSummary] = None
    legs: list[PlanLeg] = []
