from __future__ import annotations

import heapq
from dataclasses import dataclass
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.edge import Edge
from app.db.models.location import Location


@dataclass
class GraphLeg:
    edge_id: int
    from_id: int
    to_id: int
    mode: str
    distance_km: float
    time_min: float
    cost: float
    co2e_kg: float


def _edge_weight(edge: Edge, objective: dict[str, float]) -> float:
    return (
        objective.get("time", 0.0) * float(edge.base_time_min)
        + objective.get("cost", 0.0) * float(edge.base_cost)
        + objective.get("co2e", 0.0) * float(edge.co2e_kg or 0.0)
    )


def _allowed(mode: str, allowed_modes: Iterable[str]) -> bool:
    allowed = set(allowed_modes)
    return mode in allowed or mode == "transfer"


def compute_graph_route(
    db: Session,
    *,
    origin_id: int,
    destination_id: int,
    allowed_modes: list[str],
    objective: dict[str, float],
) -> list[GraphLeg]:
    edges = (
        db.execute(select(Edge).where(Edge.mode.in_(allowed_modes + ["transfer"])))
        .scalars()
        .all()
    )
    adjacency: dict[int, list[Edge]] = {}
    for edge in edges:
        adjacency.setdefault(int(edge.from_id), []).append(edge)

    frontier: list[tuple[float, int]] = [(0.0, origin_id)]
    best_cost = {origin_id: 0.0}
    previous: dict[int, tuple[int, Edge]] = {}

    while frontier:
        current_cost, node_id = heapq.heappop(frontier)
        if node_id == destination_id:
            break
        if current_cost > best_cost.get(node_id, float("inf")):
            continue

        for edge in adjacency.get(node_id, []):
            if not _allowed(edge.mode, allowed_modes):
                continue
            next_id = int(edge.to_id)
            path_cost = current_cost + _edge_weight(edge, objective)
            if path_cost < best_cost.get(next_id, float("inf")):
                best_cost[next_id] = path_cost
                previous[next_id] = (node_id, edge)
                heapq.heappush(frontier, (path_cost, next_id))

    if destination_id not in previous and destination_id != origin_id:
        return []

    route_edges: list[GraphLeg] = []
    current = destination_id
    while current != origin_id:
        prev_node, edge = previous[current]
        route_edges.append(
            GraphLeg(
                edge_id=int(edge.id),
                from_id=int(edge.from_id),
                to_id=int(edge.to_id),
                mode=str(edge.mode),
                distance_km=float(edge.distance_km),
                time_min=float(edge.base_time_min),
                cost=float(edge.base_cost),
                co2e_kg=float(edge.co2e_kg or 0.0),
            )
        )
        current = prev_node

    route_edges.reverse()
    return route_edges


def resolve_location_by_id(db: Session, location_id: int) -> Location | None:
    return db.get(Location, location_id)


def resolve_nearest_location(db: Session, lat: float, lon: float) -> Location | None:
    locations = db.execute(select(Location)).scalars().all()
    if not locations:
        return None
    return min(
        locations,
        key=lambda location: (float(location.lat) - lat) ** 2 + (float(location.lon) - lon) ** 2,
    )
