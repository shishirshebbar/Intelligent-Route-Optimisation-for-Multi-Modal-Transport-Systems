from __future__ import annotations

import json
from pathlib import Path

from app.services.evaluation_metrics import build_metrics
from app.services.evaluation_scenarios import SCENARIOS
from app.services.mode_metrics import compute_mode_metrics
from app.services.optimiser import compute_improvements, select_best_transport_plan

DEFAULT_WEIGHTS = {
    "time": 0.4,
    "delay": 0.3,
    "emissions": 0.2,
    "cost": 0.1,
}

ROOT = Path(__file__).resolve().parents[3]
DOCS_RESULTS_MD = ROOT / "docs" / "results.md"
DOCS_RESULTS_JSON = ROOT / "docs" / "results.json"


def _metrics_from_mode(mode_metrics: dict, mode: str) -> dict:
    selected = mode_metrics[mode]
    return build_metrics(
        time_min=round(selected["time_min"], 2),
        delay_min=round(selected["delay_penalty_min"], 2),
        emissions_kg=round(selected["emissions_kg"], 2),
        cost=round(selected["cost"], 2),
    )


def _mode_label(selected_mode) -> str:
    if isinstance(selected_mode, list):
        return " -> ".join(part.title() for part in selected_mode)
    return str(selected_mode).title()


def build_results(weights: dict | None = None) -> dict:
    weights = weights or DEFAULT_WEIGHTS
    scenario_results: dict[str, dict] = {}

    for scenario_name, scenario in SCENARIOS.items():
        distance_km = float(scenario["distance_km"])
        delay = scenario["delay"]
        scenario_weights = scenario.get("weights", weights)
        mode_metrics = compute_mode_metrics(distance_km, delay)

        baseline = _metrics_from_mode(mode_metrics, "road")
        optimised_choice = select_best_transport_plan(
            distance_km=distance_km,
            delay=delay,
            weights=scenario_weights,
            mode_metrics=mode_metrics,
        )
        optimised_metrics_raw = optimised_choice["metrics"]
        optimised = build_metrics(
            time_min=round(optimised_metrics_raw["time_min"], 2),
            delay_min=round(optimised_metrics_raw["delay_penalty_min"], 2),
            emissions_kg=round(optimised_metrics_raw["emissions_kg"], 2),
            cost=round(optimised_metrics_raw["cost"], 2),
        )

        scenario_results[scenario_name] = {
            "distance_km": distance_km,
            "baseline": baseline,
            "optimised": optimised,
            "improvements": compute_improvements(baseline, optimised),
            "selected_mode": _mode_label(optimised_choice["selected_mode"]),
            "is_multimodal": optimised_choice["is_multimodal"],
            "weights": scenario_weights,
        }

    return scenario_results


def render_markdown_table(results: dict) -> str:
    header = "| Scenario | Distance (km) | Delay Reduction | Emissions Saved | Cost Change | Selected Mode |"
    divider = "|---|---:|---:|---:|---:|---|"
    rows = [header, divider]

    for scenario_name, result in results.items():
        improvements = result["improvements"]
        rows.append(
            "| "
            + f"{scenario_name.replace('_', ' ').title()} | "
            + f"{result['distance_km']:.0f} | "
            + f"{improvements['delay_reduction_pct']:.1f}% | "
            + f"{improvements['emissions_saved_pct']:.1f}% | "
            + f"{improvements['cost_change_pct']:.1f}% | "
            + f"{result['selected_mode']} |"
        )

    return "\n".join(rows)


def export_results(results: dict) -> None:
    DOCS_RESULTS_JSON.write_text(json.dumps(results, indent=2), encoding="utf-8")
    DOCS_RESULTS_MD.write_text(render_markdown_table(results), encoding="utf-8")


results = build_results()


if __name__ == "__main__":
    export_results(results)
    print(json.dumps(results, indent=2))
