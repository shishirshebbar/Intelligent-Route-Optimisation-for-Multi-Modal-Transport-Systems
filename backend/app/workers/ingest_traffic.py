# backend/app/workers/ingest_traffic.py
from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import Iterable, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.location import Location
from app.db.models.event import Event
from app.services.traffic_client import get_area_traffic, get_edge_factor

# Which locations to probe for area traffic (you can narrow to 'depot' or 'customer')
DEFAULT_LOCATION_TYPES = os.getenv("TRAFFIC_LOCATION_TYPES", "depot,customer").split(",")
SLEEP_SECONDS = int(os.getenv("TRAFFIC_POLL_SECONDS", "300"))  # 5 minutes
BATCH_LIMIT = int(os.getenv("TRAFFIC_BATCH_LIMIT", "100"))

# If you also want per-edge factors, list a few demo edges here (or query from your edges table)
DEMO_EDGES = os.getenv("TRAFFIC_DEMO_EDGES", "E-1001,E-1002,E-1003").split(",")


def _get_db() -> Session:
    return SessionLocal()


def _get_target_locations(db: Session, types: Iterable[str]) -> List[Location]:
    q = (
        select(Location)
        .where(Location.type.in_([t.strip() for t in types if t.strip()]))
        .limit(BATCH_LIMIT)
    )
    return list(db.execute(q).scalars())


def _insert_event(db: Session, *, type_: str, source: str, payload: dict, severity: str = "low"):
    ev = Event(
        plan_id=None,
        type=type_,
        source=source,
        severity=severity,
        payload_json=payload,
        ts=datetime.now(timezone.utc),
    )
    db.add(ev)


async def _ingest_once(db: Session) -> int:
    """Generate traffic events from stub client. Returns inserted count."""
    rows = _get_target_locations(db, DEFAULT_LOCATION_TYPES)
    inserted = 0

    # Area-level snapshots (good for UI badges & general awareness)
    for loc in rows:
        try:
            snap = get_area_traffic(lat=float(loc.lat), lon=float(loc.lon))
        except Exception as e:
            print(f"[traffic] area snapshot failed for {loc.name} ({loc.id}): {e}")
            continue

        payload = {
            "location_id": int(loc.id),
            "location_name": loc.name,
            "lat": float(loc.lat),
            "lon": float(loc.lon),
            "congestion_index": snap.congestion_index,
            "avg_speed_kph": snap.avg_speed_kph,
            "ts": snap.ts.isoformat(),
        }
        severity = _classify_congestion(snap.congestion_index)
        _insert_event(db, type_="traffic", source=snap.source, payload=payload, severity=severity)
        inserted += 1

    # Optional: edge-level factors (handy when you later enrich plan legs)
    if DEMO_EDGES and rows:
        anchor = rows[0]  # reference location for demo edge factors
        for edge_id in [e.strip() for e in DEMO_EDGES if e.strip()]:
            try:
                pen = get_edge_factor(
                    edge_id=edge_id,
                    base_travel_time_min=10.0,  # demo base time
                    lat=float(anchor.lat),
                    lon=float(anchor.lon),
                )
            except Exception as e:
                print(f"[traffic] edge factor failed for {edge_id}: {e}")
                continue
            _insert_event(db, type_="traffic", source="stub-traffic", payload=pen, severity="moderate")
            inserted += 1

    if inserted:
        db.commit()

    return inserted


def _classify_congestion(ci: float) -> str:
    if ci >= 0.7:
        return "high"
    if ci >= 0.35:
        return "moderate"
    return "low"


async def run_loop():
    while True:
        db = _get_db()
        try:
            n = await _ingest_once(db)
            print(f"[traffic] inserted {n} events at {datetime.now(timezone.utc).isoformat()}")
        finally:
            db.close()
        await asyncio.sleep(SLEEP_SECONDS)


async def run_once():
    db = _get_db()
    try:
        n = await _ingest_once(db)
        print(f"[traffic] inserted {n} events (one-shot)")
    finally:
        db.close()


if __name__ == "__main__":
    # CLI:
    #   python -m app.workers.ingest_traffic         # loop
    #   python -m app.workers.ingest_traffic --once  # one-shot
    import sys
    if "--once" in sys.argv:
        asyncio.run(run_once())
    else:
        asyncio.run(run_loop())
