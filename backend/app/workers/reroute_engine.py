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
        .filter(Plan.status == "ACTIVE")
        .all()
    )

    for plan in active_plans:
        await optimise_plan(plan, db)


async def reroute_loop(poll_seconds: int = 30):
    """
    Periodically scan for new events and trigger re-routing.
    """
    db = SessionLocal()
    try:
        while True:
            events = (
                db.query(Event)
                .order_by(Event.ts.desc())
                .limit(10)
                .all()
            )

            for event in events:
                await process_event(event, db)

            await asyncio.sleep(poll_seconds)
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(reroute_loop())
