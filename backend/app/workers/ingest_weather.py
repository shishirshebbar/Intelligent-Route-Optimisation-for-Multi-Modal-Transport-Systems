# backend/app/workers/ingest_weather.py
from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import Iterable, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.location import Location  # expects fields: id, name, type, lat, lon
from app.db.models.event import Event
from app.services.weather_client import fetch_current_weather


DEFAULT_LOCATION_TYPES = os.getenv("WEATHER_LOCATION_TYPES", "depot,port,airport").split(",")
SLEEP_SECONDS = int(os.getenv("WEATHER_POLL_SECONDS", "300"))  # 5 minutes
BATCH_LIMIT = int(os.getenv("WEATHER_BATCH_LIMIT", "50"))


def _get_db() -> Session:
    return SessionLocal()


def _get_target_locations(db: Session, types: Iterable[str]) -> List[Location]:
    q = (
        select(Location)
        .where(Location.type.in_([t.strip() for t in types if t.strip()]))
        .limit(BATCH_LIMIT)
    )
    return list(db.execute(q).scalars())


async def _ingest_once(db: Session) -> int:
    """Fetch weather for target locations and insert Event rows. Returns count inserted."""
    rows = _get_target_locations(db, DEFAULT_LOCATION_TYPES)
    inserted = 0

    for loc in rows:
        try:
            snap = await fetch_current_weather(lat=float(loc.lat), lon=float(loc.lon))
        except Exception as e:
            # log and continue
            print(f"[weather] fetch failed for {loc.name} ({loc.id}): {e}")
            continue

        ev = Event(
            plan_id=None,
            type="weather",
            source=snap.source,
            severity=_classify_weather(snap.temperature_c, snap.precipitation_mm, snap.wind_speed_mps),
            payload_json={
                "location_id": int(loc.id),
                "location_name": loc.name,
                "lat": float(loc.lat),
                "lon": float(loc.lon),
                "temperature_c": snap.temperature_c,
                "precipitation_mm": snap.precipitation_mm,
                "wind_speed_mps": snap.wind_speed_mps,
                "relative_humidity_pct": snap.relative_humidity_pct,
                "retrieved_at": snap.retrieved_at.isoformat(),
            },
            ts=datetime.now(timezone.utc),
        )
        db.add(ev)
        inserted += 1

    if inserted:
        db.commit()

    return inserted


def _classify_weather(temp_c: float | None, rain_mm: float | None, wind_mps: float | None) -> str:
    """Very simple severity heuristic for UI badges."""
    rain = rain_mm or 0.0
    wind = wind_mps or 0.0
    if rain > 8 or wind > 15:
        return "high"
    if rain > 2 or wind > 8:
        return "moderate"
    return "low"


async def run_loop():
    """Run forever with sleep between iterations."""
    while True:
        db = _get_db()
        try:
            n = await _ingest_once(db)
            print(f"[weather] inserted {n} events at {datetime.now(timezone.utc).isoformat()}")
        finally:
            db.close()
        await asyncio.sleep(SLEEP_SECONDS)


async def run_once():
    db = _get_db()
    try:
        n = await _ingest_once(db)
        print(f"[weather] inserted {n} events (one-shot)")
    finally:
        db.close()


if __name__ == "__main__":
    # CLI:
    #   python -m app.workers.ingest_weather             # loop
    #   python -m app.workers.ingest_weather --once      # one-shot
    import sys
    if "--once" in sys.argv:
        asyncio.run(run_once())
    else:
        asyncio.run(run_loop())
