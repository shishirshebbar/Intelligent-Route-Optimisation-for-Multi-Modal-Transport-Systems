from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.db.session import SessionLocal
from app.db.models.location import Location
from app.schemas.network import (
    LocationIn,
    LocationOut,
    LocationListResponse,
    LocationType,
)

router = APIRouter(prefix="/network", tags=["network"])

# --- DB session dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Helpers ---
def to_location_out(row: Location) -> LocationOut:
    return LocationOut(
        id=row.id,
        name=row.name,
        type=row.type,  # type: ignore[arg-type]
        lat=float(row.lat),
        lon=float(row.lon),
    )

# --- GET /network/locations ---
@router.get("/locations", response_model=LocationListResponse)
def list_locations(
    q: Optional[str] = Query(default=None, description="Free-text search on name"),
    type: Optional[LocationType] = Query(default=None, description="Filter by type"),
    bbox: Optional[str] = Query(
        default=None,
        description="Bounding box as 'minLon,minLat,maxLon,maxLat'",
        examples=["77.4,12.8,77.8,13.1"],
    ),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Returns locations with optional filters:
    - q: ILIKE on name
    - type: depot|port|rail|airport|customer
    - bbox: numeric bounding box (lon/lat) -> minLon,minLat,maxLon,maxLat
    - pagination: limit/offset
    """
    stmt = select(Location)
    count_stmt = select(func.count(Location.id))

    # filters
    conditions = []
    if q:
        like = f"%{q}%"
        conditions.append(Location.name.ilike(like))
    if type:
        conditions.append(Location.type == type)

    min_lon = min_lat = max_lon = max_lat = None
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) != 4:
                raise ValueError
            min_lon, min_lat, max_lon, max_lat = parts
            # numeric bbox filter on lon/lat (no PostGIS needed)
            conditions.append(Location.lon.between(min_lon, max_lon))
            conditions.append(Location.lat.between(min_lat, max_lat))
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid bbox format. Use 'minLon,minLat,maxLon,maxLat'",
            )

    for cond in conditions:
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    # order + pagination
    stmt = stmt.order_by(Location.id.asc()).limit(limit).offset(offset)

    # execute
    rows = db.execute(stmt).scalars().all()
    total = db.execute(count_stmt).scalar_one()

    return LocationListResponse(
        data=[to_location_out(r) for r in rows],
        total=total,
    )

# --- POST /network/locations ---
@router.post("/locations", response_model=LocationOut, status_code=201)
def create_location(body: LocationIn, db: Session = Depends(get_db)):
    """
    Inserts a new location. The DB trigger will populate the `geom` column.
    """
    # (Optional) basic uniqueness guard: same name+coords
    existing = db.execute(
        select(Location).where(
            Location.name == body.name,
            Location.lat == body.lat,
            Location.lon == body.lon,
        )
    ).scalars().first()
    if existing:
        # 409 Conflict if exact duplicate
        raise HTTPException(status_code=409, detail="Location already exists")

    row = Location(
        name=body.name,
        type=body.type,  # type: ignore[arg-type]
        lat=body.lat,
        lon=body.lon,
    )
    db.add(row)
    db.commit()
    db.refresh(row)  # get generated id (and trigger-updated fields if any)

    return to_location_out(row)
