from app.services.vrp import solve_vrptw


time_matrix = [
    [0, 12, 20, 15],
    [12, 0, 10, 18],
    [20, 10, 0, 14],
    [15, 18, 14, 0],
]

demands = [0, 500, 700, 400]
time_windows = [
    (0, 1440),
    (480, 1080),
    (480, 1080),
    (480, 1080),
]

vehicle_capacities = [1500, 1500]

result = solve_vrptw(
    time_matrix=time_matrix,
    demands=demands,
    time_windows=time_windows,
    vehicle_capacities=vehicle_capacities,
    num_vehicles=2,
    depot=0
)

print(result)
