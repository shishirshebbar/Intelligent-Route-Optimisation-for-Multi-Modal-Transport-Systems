from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ShipmentIn(BaseModel):
    id: str = Field(..., min_length=1)
    origin_id: int
    destination_id: int
    volume_m3: float = Field(..., ge=0)
    weight_kg: float = Field(..., ge=0)
    ready_time: datetime
    due_time: datetime
    priority: Optional[int] = 0

class ShipmentOut(BaseModel):
    id: str
    origin_id: int
    destination_id: int
    volume_m3: float
    weight_kg: float
    ready_time: datetime
    due_time: datetime
    priority: int

class BulkShipmentIn(BaseModel):
    shipments: list[ShipmentIn]

# Optional filters for GET /shipments
class ShipmentQuery(BaseModel):
    due_before: Optional[datetime] = None
    priority: Optional[int] = None

class ShipmentListResponse(BaseModel):
    data: list[ShipmentOut]
    total: int
