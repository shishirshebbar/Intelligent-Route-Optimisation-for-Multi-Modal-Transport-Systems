#backend/app/services/route_comparator.py
def compute_dynamic_kpis(baseline: dict, optimised: dict) -> dict:
    return {
        "delay_reduction_pct": round(
            (baseline["delay_min"] - optimised["delay_min"])
            / max(1.0, baseline["delay_min"]) * 100,
            2,
        ),
        "emissions_saved_pct": round(
            (baseline["emissions_kg"] - optimised["emissions_kg"])
            / max(1.0, baseline["emissions_kg"]) * 100,
            2,
        ),
        "cost_change_pct": round(
            (optimised["cost"] - baseline["cost"])
            / max(1.0, baseline["cost"]) * 100,
            2,
        ),
    }
