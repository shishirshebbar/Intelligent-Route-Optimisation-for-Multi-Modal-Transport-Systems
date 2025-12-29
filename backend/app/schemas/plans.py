from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

PlanStatus = Literal["draft", "active", "rerouted", "completed", "failed"]
LegMode = Literal["road", "rail", "sea", "air", "transfer"]



class PlanCreate(BaseModel):
    shipment_ids: list[str]
    objective: Optional[str] = None
    modes: Optional[list[str]] = None
    constraints: Optional[dict] = None


class PlanSummary(BaseModel):
    total_cost: Optional[float] = None
    total_time_min: Optional[int] = None
    total_co2e_kg: Optional[float] = None
    on_time_probability: float | None = None

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
    total_distance_km: float
    total_time_min: float
    total_co2e_kg: float

    # ML outputs
    delay_prob: Optional[float]
    expected_delay_min: Optional[float]
