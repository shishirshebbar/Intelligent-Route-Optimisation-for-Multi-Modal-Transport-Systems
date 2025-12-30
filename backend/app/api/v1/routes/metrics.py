from fastapi import APIRouter
from app.services.run_evaluation import results

router = APIRouter()

@router.get("/metrics/evaluation")
def get_evaluation_metrics():
    return {
        "delay_reduction_pct": results["traffic"]["improvements"]["delay_reduction_pct"],
        "emissions_saved_pct": results["traffic"]["improvements"]["emissions_saved_pct"],
        "cost_change_pct": results["traffic"]["improvements"]["cost_change_pct"],
        "reroutes_count": 1  # from DB COUNT where was_rerouted = true
    }
