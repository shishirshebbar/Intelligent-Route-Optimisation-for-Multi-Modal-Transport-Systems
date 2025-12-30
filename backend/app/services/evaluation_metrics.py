def build_metrics(time_min, delay_min, emissions_kg, cost):
    return {
        "time_min": time_min,
        "delay_min": delay_min,
        "emissions_kg": emissions_kg,
        "cost": cost,
    }
