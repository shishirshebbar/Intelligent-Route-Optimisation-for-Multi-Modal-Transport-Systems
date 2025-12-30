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
    """
    Solve Vehicle Routing Problem with Time Windows (VRPTW).

    Returns:
      {
        "routes": [
            { "vehicle_id": 0, "stops": [0, 3, 5, 2, 0], "total_time": 142 }
        ],
        "objective": total_cost
      }
    """

    manager = pywrapcp.RoutingIndexManager(
        len(time_matrix),
        num_vehicles,
        depot
    )

    routing = pywrapcp.RoutingModel(manager)

    # ----- Time callback -----
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # ----- Capacity constraint -----
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)

    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,                       # no slack
        vehicle_capacities,
        True,
        "Capacity"
    )

    # ----- Time window constraint -----
    routing.AddDimension(
        transit_callback_index,
        30,                      # waiting allowed
        24 * 60,                 # max time per vehicle
        False,
        "Time"
    )

    time_dim = routing.GetDimensionOrDie("Time")

    for idx, window in enumerate(time_windows):
        index = manager.NodeToIndex(idx)
        time_dim.CumulVar(index).SetRange(window[0], window[1])

    # Depot window
    for v in range(num_vehicles):
        start = routing.Start(v)
        end = routing.End(v)
        time_dim.CumulVar(start).SetRange(0, 24 * 60)
        time_dim.CumulVar(end).SetRange(0, 24 * 60)

    # ----- Search parameters -----
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

    # ----- Extract solution -----
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
