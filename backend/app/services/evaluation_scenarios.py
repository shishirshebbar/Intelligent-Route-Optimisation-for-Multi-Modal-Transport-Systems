SCENARIOS = {
    "normal": {
        "traffic": {"congestion_index": 0.2},
        "weather": {"precipitation_mm": 0},
        "delay": {"delay_prob": 0.1, "expected_delay_min": 5},
    },
    "traffic": {
        "traffic": {"congestion_index": 0.85},
        "weather": {"precipitation_mm": 0},
        "delay": {"delay_prob": 0.4, "expected_delay_min": 15},
    },
    "weather": {
        "traffic": {"congestion_index": 0.6},
        "weather": {"precipitation_mm": 18},
        "delay": {"delay_prob": 0.7, "expected_delay_min": 30},
    },
}
