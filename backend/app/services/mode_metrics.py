from app.services.mode_params import MODE_PARAMS


def compute_mode_metrics(distance_km, delay):
    """
    delay = {
        "delay_prob": float,
        "expected_delay_min": float
    }
    """

    results = {}

    for mode, p in MODE_PARAMS.items():
        time_min = (distance_km / p["speed_kph"]) * 60
        time_min += p["transfer_penalty_min"]

        delay_penalty = (
            delay["delay_prob"] * time_min
            + delay["expected_delay_min"]
        )

        emissions = distance_km * p["emission_kg_per_km"]
        cost = distance_km * p["cost_per_km"]

        results[mode] = {
            "time_min": time_min,
            "delay_penalty_min": delay_penalty,
            "emissions_kg": emissions,
            "cost": cost,
        }

    return results
