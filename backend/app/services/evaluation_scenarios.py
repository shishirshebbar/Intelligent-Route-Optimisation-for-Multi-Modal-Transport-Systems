SCENARIOS = {
    "normal": {
        "distance_km": 30,
        "traffic": {"congestion_index": 0.2},
        "weather": {"precipitation_mm": 0},
        "delay": {"delay_prob": 0.1, "expected_delay_min": 5},
        "weights": {"time": 0.6, "delay": 0.25, "emissions": 0.1, "cost": 0.05},
    },
    "traffic": {
        "distance_km": 320,
        "traffic": {"congestion_index": 0.85},
        "weather": {"precipitation_mm": 0},
        "delay": {"delay_prob": 0.4, "expected_delay_min": 15},
        "weights": {"time": 0.4, "delay": 0.3, "emissions": 0.2, "cost": 0.1},
    },
    "weather": {
        "distance_km": 320,
        "traffic": {"congestion_index": 0.6},
        "weather": {"precipitation_mm": 18},
        "delay": {"delay_prob": 0.7, "expected_delay_min": 30},
        "weights": {"time": 0.35, "delay": 0.35, "emissions": 0.2, "cost": 0.1},
    },
    "peak_hour": {
        "distance_km": 180,
        "traffic": {"congestion_index": 0.92},
        "weather": {"precipitation_mm": 2},
        "delay": {"delay_prob": 0.55, "expected_delay_min": 18},
        "weights": {"time": 0.8, "delay": 0.19, "emissions": 0.005, "cost": 0.005},
    },
    "green_corridor": {
        "distance_km": 600,
        "traffic": {"congestion_index": 0.15},
        "weather": {"precipitation_mm": 0},
        "delay": {"delay_prob": 0.05, "expected_delay_min": 3},
        "weights": {"time": 0.1, "delay": 0.1, "emissions": 0.4, "cost": 0.4},
    },
}
