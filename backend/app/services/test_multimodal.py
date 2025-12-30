from app.services.mode_metrics import compute_mode_metrics
from app.services.optimiser import select_best_transport_plan

delay = {
    "delay_prob": 0.25,
    "expected_delay_min": 20,
}

distance_km = 800

weights = {
    "time": 0.4,
    "delay": 0.3,
    "emissions": 0.2,
    "cost": 0.1,
}

mode_metrics = compute_mode_metrics(distance_km, delay)

result = select_best_transport_plan(
    distance_km=distance_km,
    delay=delay,
    weights=weights,
    mode_metrics=mode_metrics,
)

print(result)
