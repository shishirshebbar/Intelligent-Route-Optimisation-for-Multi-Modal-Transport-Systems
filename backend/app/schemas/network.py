from typing import Literal, Optional
from pydantic import BaseModel, Field, conlist

# ---- Enums / literals
LocationType = Literal["depot", "port", "rail", "airport", "customer"]
EdgeMode = Literal["road", "rail", "sea", "air", "transfer"]

# ---- Location DTOs
class LocationIn(BaseModel):
    name: str = Field(..., min_length=1)
    type: LocationType
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)

class LocationOut(BaseModel):
    id: int
    name: str
    type: LocationType
    lat: float
    lon: float

# ---- Edge DTOs (optional but handy for /network/edges endpoints)
class EdgeIn(BaseModel):
    from_id: int
    to_id: int
    mode: EdgeMode
    distance_km: float = Field(..., ge=0)
    base_time_min: int = Field(..., ge=0)
    base_cost: float = Field(..., ge=0)
    co2e_kg: Optional[float] = Field(None, ge=0)

class EdgeOut(BaseModel):
    id: int
    from_id: int
    to_id: int
    mode: EdgeMode
    distance_km: float
    base_time_min: int
    base_cost: float
    co2e_kg: Optional[float] = None

# ---- Optional helpers for list responses and filters
class LocationListResponse(BaseModel):
    data: list[LocationOut]
    total: int

class LocationQuery(BaseModel):
    q: Optional[str] = None
    type: Optional[LocationType] = None
    # bbox: [minLon, minLat, maxLon, maxLat]
    bbox: Optional[conlist(float, min_length=4, max_length=4)] = None
