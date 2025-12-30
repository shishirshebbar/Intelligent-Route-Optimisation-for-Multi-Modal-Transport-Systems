MODES = ["road", "rail", "sea", "air"]

MODE_PARAMS = {
    "road": {
        "speed_kph": 40,
        "emission_kg_per_km": 0.12,
        "cost_per_km": 12,
        "transfer_penalty_min": 0,
    },
    "rail": {
        "speed_kph": 60,
        "emission_kg_per_km": 0.04,
        "cost_per_km": 6,
        "transfer_penalty_min": 45,
    },
    "sea": {
        "speed_kph": 30,
        "emission_kg_per_km": 0.02,
        "cost_per_km": 4,
        "transfer_penalty_min": 120,
    },
    "air": {
        "speed_kph": 500,
        "emission_kg_per_km": 0.6,
        "cost_per_km": 45,
        "transfer_penalty_min": 90,
    },
}
