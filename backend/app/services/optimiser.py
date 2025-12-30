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
