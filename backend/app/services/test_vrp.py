from app.services.vrp import (
    solve_vrptw,
    build_delay_aware_time_matrix,
    compute_delay_penalty_used,
)

# --- Base matrix ---
base_time_matrix = [
    [0, 12, 20],
    [12, 0, 15],
    [20, 15, 0],
]

# --- Delay penalties ---
delay_penalties = [
    [0, 8, 15],
    [8, 0, 4],
    [15, 4, 0],
]

# Build delay-aware matrix
final_matrix = build_delay_aware_time_matrix(
    base_time_matrix,
    delay_penalties,
    alpha=1.0,
)

print("Base matrix:")
for r in base_time_matrix:
    print(r)

print("\nDelay-aware matrix:")
for r in final_matrix:
    print(r)

# --- Minimal VRP constraints ---
demands = [0, 1, 1]
time_windows = [(0, 100)] * 3
vehicle_capacities = [2]
num_vehicles = 1

# Baseline VRP
baseline_result = solve_vrptw(
    time_matrix=base_time_matrix,
    demands=demands,
    time_windows=time_windows,
    vehicle_capacities=vehicle_capacities,
    num_vehicles=num_vehicles,
)

# Delay-aware VRP
delay_aware_result = solve_vrptw(
    time_matrix=final_matrix,
    demands=demands,
    time_windows=time_windows,
    vehicle_capacities=vehicle_capacities,
    num_vehicles=num_vehicles,
)

delay_penalty_used = compute_delay_penalty_used(
    delay_aware_result["routes"],
    delay_penalties,
)

print("\nBaseline objective:", baseline_result["objective"])
print("Delay-aware objective:", delay_aware_result["objective"])
print("Delay penalty used:", delay_penalty_used)
