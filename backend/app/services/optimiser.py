def score_route(metrics, weights):
    return (
        weights["time"] * metrics["time_min"]
        + weights["delay"] * metrics["delay_penalty_min"]
        + weights["emissions"] * metrics["emissions_kg"]
        + weights["cost"] * metrics["cost"]
    )
def choose_best_mode(mode_metrics, weights):
    scored = []

    for mode, metrics in mode_metrics.items():
        s = score_route(metrics, weights)
        scored.append((mode, s, metrics))

    scored.sort(key=lambda x: x[1])
    return scored[0]  # (mode, score, metrics)
from app.services.mode_params import MODE_PARAMS

MULTIMODAL_CHAINS = [
    ["road", "rail", "road"],
    ["road", "sea", "road"],
]


def evaluate_chain(chain, distance_km, delay, weights):
    total = {
        "time_min": 0,
        "delay_penalty_min": 0,
        "emissions_kg": 0,
        "cost": 0,
    }

    segment_distance = distance_km / len(chain)

    for mode in chain:
        p = MODE_PARAMS[mode]

        time = (segment_distance / p["speed_kph"]) * 60
        time += p["transfer_penalty_min"]

        total["time_min"] += time
        total["delay_penalty_min"] += delay["delay_prob"] * time
        total["emissions_kg"] += segment_distance * p["emission_kg_per_km"]
        total["cost"] += segment_distance * p["cost_per_km"]

    score = score_route(total, weights)
    return score, total
def select_best_transport_plan(
    distance_km,
    delay,
    weights,
    mode_metrics,
):
    candidates = []

    # Single-mode
    mode, score, metrics = choose_best_mode(mode_metrics, weights)
    candidates.append(("single", mode, score, metrics))

    # Multi-modal
    for chain in MULTIMODAL_CHAINS:
        score, metrics = evaluate_chain(chain, distance_km, delay, weights)
        candidates.append(("chain", chain, score, metrics))

    best = min(candidates, key=lambda x: x[2])

    return {
        "selected_mode": best[1],
        "is_multimodal": best[0] == "chain",
        "metrics": best[3],
    }
from app.db.models.event import Event
from app.services.mode_metrics import compute_mode_metrics


async def optimise_plan(plan, db):
    """
    Recompute routing & mode selection for a plan
    when a re-routing event is triggered.
    """

    # --- NOTE ---
    #  we DO NOT recompute the full VRP graph here.
    # We demonstrate orchestration + reuse of existing modules.

    # Example placeholders (replace with real values later)
    distance_km = plan.total_distance_km or 500

    delay = {
        "delay_prob": plan.delay_prob or 0.4,
        "expected_delay_min": plan.expected_delay_min or 20,
    }

    weights = {
        "time": 0.4,
        "delay": 0.3,
        "emissions": 0.2,
        "cost": 0.1,
    }

    # STEP-3 reuse: compute mode metrics
    mode_metrics = compute_mode_metrics(distance_km, delay)

    # STEP-3 reuse: select best mode / chain
    result = select_best_transport_plan(
        distance_km=distance_km,
        delay=delay,
        weights=weights,
        mode_metrics=mode_metrics,
    )

    # Update plan
    plan.selected_mode = result["selected_mode"]
    plan.is_multimodal = result["is_multimodal"]
    plan.was_rerouted = True
    plan.reroute_reason = "EVENT_TRIGGERED"

    db.commit()

    # Emit reroute event for frontend
    db.add(Event(
        type="reroute",
        payload_json={
            "plan_id": plan.id,
            "reason": plan.reroute_reason,
            "new_mode": plan.selected_mode,
        }
    ))
    db.commit()
