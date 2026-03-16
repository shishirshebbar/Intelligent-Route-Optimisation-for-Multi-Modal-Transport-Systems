from typing import Generator

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.event import Event
from app.db.models.plan import Plan
from app.db.session import SessionLocal
from app.services.run_evaluation import results

router = APIRouter()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/metrics/evaluation")
def get_evaluation_metrics(db: Session = Depends(get_db)):
    reroutes_from_events = db.execute(
        select(func.count()).select_from(Event).where(Event.type == "reroute")
    ).scalar_one()
    reroutes_from_plans = db.execute(
        select(func.count()).select_from(Plan).where(Plan.was_rerouted.is_(True))
    ).scalar_one()

    return {
        "delay_reduction_pct": results["traffic"]["improvements"]["delay_reduction_pct"],
        "emissions_saved_pct": results["traffic"]["improvements"]["emissions_saved_pct"],
        "cost_change_pct": results["traffic"]["improvements"]["cost_change_pct"],
        "reroutes_count": max(int(reroutes_from_events), int(reroutes_from_plans)),
    }
