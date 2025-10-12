from __future__ import annotations

from typing import Generator, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select, text
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.location import Location as LocationModel
from app.schemas.network import (
    LocationIn,
    LocationOut,
    LocationListResponse,
    LocationType,
)

router = APIRouter(tags=["network"], prefix="/network")


# ---------- DB session dependency ----------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Helpers ----------
def _to_location_out(m: LocationModel) -> LocationOut:
    return LocationOut(
        id=m.id,
        name=m.name,
        type=m.type,  # Literal enforced by schema
        lat=float(m.lat),
        lon=float(m.lon),
    )


def _parse_bbox(bbox_str: str) -> Tuple[float, float, float, float]:
    """
    Accepts 'minLon,minLat,maxLon,maxLat' and returns tuple of floats.
    Raises ValueError if invalid.
    """
    parts = [p.strip() for p in bbox_str.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must have 4 comma-separated numbers: minLon,minLat,maxLon,maxLat")
    min_lon, min_lat, max_lon, max_lat = map(float, parts)
    if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180 and -90 <= min_lat <= 90 and -90 <= max_lat <= 90):
        raise ValueError("bbox coordinates out of range")
    if min_lon >= max_lon or min_lat >= max_lat:
        raise ValueError("bbox min must be less than max")
    return (min_lon, min_lat, max_lon, max_lat)


# ---------- GET /network/locations ----------
@router.get("/locations", response_model=LocationListResponse)
def list_locations(
    q: Optional[str] = Query(None, description="Free-text search on name"),
    type: Optional[LocationType] = Query(None, alias="type", description="Filter by location type"),
    bbox: Optional[str] = Query(
        None,
        description="Bounding box filter: 'minLon,minLat,maxLon,maxLat' (WGS84)",
        examples={"blr_core": {"value": "77.49,12.86,77.80,13.12"}},
    ),
    db: Session = Depends(get_db),
):
    """
    List locations with optional filters:
      - q: substring match on name (case-insensitive)
      - type: depot|port|rail|airport|customer
      - bbox: minLon,minLat,maxLon,maxLat (WGS84)

    Note: bbox uses PostGIS; we cast geography->geometry and compare with ST_MakeEnvelope(..., 4326).
    """
    # Start with a SQLAlchemy selectable
    stmt = select(LocationModel)

    conditions = []

    if q:
        # ILIKE for case-insensitive substring match
        conditions.append(LocationModel.name.ilike(f"%{q}%"))

    if type:
        conditions.append(LocationModel.type == type)

    # BBOX filter via PostGIS (no geoalchemy2 required)
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = _parse_bbox(bbox)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Use a text() predicate that Postgres understands.
        # locations.geom is geography(Point,4326); cast to geometry for envelope intersection.
        bbox_predicate = text(
            "ST_Within(geom::geometry, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326))"
        )
        stmt = stmt.where(
            and_(
                *conditions,
                bbox_predicate.bindparams(
                    min_lon=min_lon, min_lat=min_lat, max_lon=max_lon, max_lat=max_lat
                ),
            )
        )
    elif conditions:
        stmt = stmt.where(and_(*conditions))

    rows: List[LocationModel] = db.execute(stmt).scalars().all()
    data = [_to_location_out(r) for r in rows]
    return LocationListResponse(data=data, total=len(data))


# ---------- POST /network/locations ----------
@router.post("/locations", response_model=LocationOut, status_code=201)
def create_location(
    payload: LocationIn,
    db: Session = Depends(get_db),
):
    """
    Create a new location.
    DB trigger will populate the 'geom' column from lon/lat.
    """
    # Optional: you could check duplicates by (name, type, lat, lon) if needed.
    m = LocationModel(
        name=payload.name,
        type=payload.type,
        lat=payload.lat,
        lon=payload.lon,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_location_out(m)
