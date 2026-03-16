import asyncio
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.event import Event
from app.db.models.plan import Plan
from app.services.optimiser import optimise_plan


CONGESTION_THRESHOLD = 0.75
RAIN_THRESHOLD = 10.0
DELAY_THRESHOLD = 0.6


async def process_event(event: Event, db: Session):
    """
    Decide whether an event requires re-routing.
    """

    payload = event.payload_json or {}
    needs_reroute = False

    if event.type == "traffic":
        if payload.get("congestion_index", 0) > CONGESTION_THRESHOLD:
            needs_reroute = True

    elif event.type == "weather":
        if payload.get("precipitation_mm", 0) > RAIN_THRESHOLD:
            needs_reroute = True

    elif event.type == "delay":
        if payload.get("delay_prob", 0) > DELAY_THRESHOLD:
            needs_reroute = True

    if not needs_reroute:
        return

    # Fetch active plans
    active_plans = (
        db.query(Plan)
        .filter(Plan.status == "active")
        .all()
    )

    for plan in active_plans:
        await optimise_plan(plan, db)


async def reroute_loop(poll_seconds: int = 30):
    """
    Periodically scan for new events and trigger re-routing.
    """
    db = SessionLocal()
    last_seen_event_id = 0
    try:
        while True:
            events = (
                db.query(Event)
                .filter(Event.id > last_seen_event_id)
                .order_by(Event.id.asc())
                .all()
            )

            for event in events:
                await process_event(event, db)
                last_seen_event_id = max(last_seen_event_id, int(event.id))

            await asyncio.sleep(poll_seconds)
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(reroute_loop())
