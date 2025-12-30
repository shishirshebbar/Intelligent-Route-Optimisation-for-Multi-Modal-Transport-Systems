from typing import List, Dict, Any
from ortools.constraint_solver import pywrapcp, routing_enums_pb2


def solve_vrptw(
    time_matrix: List[List[int]],
    demands: List[int],
    time_windows: List[tuple],
    vehicle_capacities: List[int],
    num_vehicles: int,
    depot: int = 0,
) -> Dict[str, Any]:

    manager = pywrapcp.RoutingIndexManager(
        len(time_matrix),
        num_vehicles,
        depot
    )

    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)

    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        vehicle_capacities,
        True,
        "Capacity"
    )

    routing.AddDimension(
        transit_callback_index,
        30,
        24 * 60,
        False,
        "Time"
    )

    time_dim = routing.GetDimensionOrDie("Time")

    for idx, window in enumerate(time_windows):
        index = manager.NodeToIndex(idx)
        time_dim.CumulVar(index).SetRange(window[0], window[1])

    for v in range(num_vehicles):
        time_dim.CumulVar(routing.Start(v)).SetRange(0, 24 * 60)
        time_dim.CumulVar(routing.End(v)).SetRange(0, 24 * 60)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = 10

    solution = routing.SolveWithParameters(search_params)

    if not solution:
        return {"routes": [], "objective": None}

    routes = []
    for v in range(num_vehicles):
        index = routing.Start(v)
        route = []
        total_time = 0

        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            route.append(node)
            prev = index
            index = solution.Value(routing.NextVar(index))
            total_time += routing.GetArcCostForVehicle(prev, index, v)

        route.append(manager.IndexToNode(index))

        routes.append({
            "vehicle_id": v,
            "stops": route,
            "total_time_min": total_time
        })

    return {
        "routes": routes,
        "objective": solution.ObjectiveValue()
    }


def build_delay_aware_time_matrix(
    base_time_matrix: list[list[int]],
    delay_penalties: list[list[float]],
    alpha: float = 1.0,
) -> list[list[int]]:

    size = len(base_time_matrix)
    out = [[0] * size for _ in range(size)]

    for i in range(size):
        for j in range(size):
            out[i][j] = int(
                base_time_matrix[i][j] + alpha * delay_penalties[i][j]
            )

    return out


def compute_delay_penalty_used(routes, delay_penalties):
    total = 0.0
    for r in routes:
        stops = r["stops"]
        for i, j in zip(stops, stops[1:]):
            total += delay_penalties[i][j]
    return total
