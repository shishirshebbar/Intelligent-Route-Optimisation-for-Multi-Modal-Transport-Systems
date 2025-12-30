from app.services.evaluation_scenarios import SCENARIOS
from app.services.evaluation_metrics import build_metrics
from app.services.optimiser import compute_improvements

# Dummy example values (replace with real outputs if needed)
BASELINE = {
    "normal": build_metrics(420, 55, 92, 8200),
    "traffic": build_metrics(460, 80, 110, 8500),
    "weather": build_metrics(480, 95, 105, 8300),
}

OPTIMISED = {
    "normal": build_metrics(450, 48, 75, 7950),
    "traffic": build_metrics(470, 44, 53, 7800),
    "weather": build_metrics(500, 38, 63, 8460),
}

results = {}

for scenario in SCENARIOS:
    results[scenario] = {
        "baseline": BASELINE[scenario],
        "optimised": OPTIMISED[scenario],
        "improvements": compute_improvements(
            BASELINE[scenario],
            OPTIMISED[scenario],
        )
    }

print(results)
