from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import text

from app.db.session import SessionLocal


DEMO_LOCATIONS = [
    {"id": 1, "name": "WH-A", "type": "depot", "lat": 12.9716, "lon": 77.5946},
    {"id": 2, "name": "WH-B", "type": "depot", "lat": 12.9352, "lon": 77.6245},
    {"id": 3, "name": "Rail-Yard", "type": "rail", "lat": 12.9991, "lon": 77.5700},
    {"id": 4, "name": "Port-Z", "type": "port", "lat": 13.0500, "lon": 77.5500},
    {"id": 5, "name": "Airport-Hub", "type": "airport", "lat": 13.1986, "lon": 77.7066},
    {"id": 6, "name": "Customer-North", "type": "customer", "lat": 13.0358, "lon": 77.5970},
    {"id": 7, "name": "Customer-South", "type": "customer", "lat": 12.9081, "lon": 77.6476},
]

DEMO_VEHICLES = [
    {
        "id": "V-1",
        "mode": "road",
        "capacity_kg": 10000.0,
        "capacity_m3": 30.0,
        "co2e_per_km": 0.85,
        "fixed_cost": 0.0,
        "variable_cost_per_km": 12.0,
    }
]

DEMO_SHIPMENTS = [
    {
        "id": "S1",
        "origin_id": 1,
        "destination_id": 6,
        "volume_m3": 4.0,
        "weight_kg": 850.0,
        "ready_time": datetime(2026, 3, 17, 8, 0, tzinfo=timezone.utc),
        "due_time": datetime(2026, 3, 17, 14, 0, tzinfo=timezone.utc),
        "priority": 2,
    },
    {
        "id": "S2",
        "origin_id": 2,
        "destination_id": 7,
        "volume_m3": 6.5,
        "weight_kg": 1400.0,
        "ready_time": datetime(2026, 3, 17, 9, 0, tzinfo=timezone.utc),
        "due_time": datetime(2026, 3, 17, 18, 0, tzinfo=timezone.utc),
        "priority": 3,
    },
    {
        "id": "S3",
        "origin_id": 1,
        "destination_id": 7,
        "volume_m3": 3.2,
        "weight_kg": 620.0,
        "ready_time": datetime(2026, 3, 17, 7, 30, tzinfo=timezone.utc),
        "due_time": datetime(2026, 3, 17, 13, 30, tzinfo=timezone.utc),
        "priority": 1,
    },
]

DEMO_EDGES = [
    {"from_id": 1, "to_id": 6, "mode": "road", "distance_km": 18.0, "base_time_min": 32, "base_cost": 216.0, "co2e_kg": 2.16, "timetable_json": None},
    {"from_id": 1, "to_id": 3, "mode": "road", "distance_km": 12.0, "base_time_min": 20, "base_cost": 144.0, "co2e_kg": 1.44, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 3, "to_id": 6, "mode": "rail", "distance_km": 28.0, "base_time_min": 24, "base_cost": 168.0, "co2e_kg": 1.12, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 1, "to_id": 4, "mode": "road", "distance_km": 16.0, "base_time_min": 28, "base_cost": 192.0, "co2e_kg": 1.92, "timetable_json": '{"service":"sea-demo"}'},
    {"from_id": 4, "to_id": 6, "mode": "sea", "distance_km": 44.0, "base_time_min": 88, "base_cost": 176.0, "co2e_kg": 0.88, "timetable_json": '{"service":"coastal-demo"}'},
    {"from_id": 1, "to_id": 5, "mode": "road", "distance_km": 34.0, "base_time_min": 46, "base_cost": 408.0, "co2e_kg": 4.08, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 5, "to_id": 6, "mode": "air", "distance_km": 22.0, "base_time_min": 18, "base_cost": 990.0, "co2e_kg": 13.2, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 2, "to_id": 7, "mode": "road", "distance_km": 16.0, "base_time_min": 30, "base_cost": 192.0, "co2e_kg": 1.92, "timetable_json": None},
    {"from_id": 2, "to_id": 3, "mode": "road", "distance_km": 14.0, "base_time_min": 24, "base_cost": 168.0, "co2e_kg": 1.68, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 3, "to_id": 7, "mode": "rail", "distance_km": 24.0, "base_time_min": 22, "base_cost": 144.0, "co2e_kg": 0.96, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 2, "to_id": 4, "mode": "road", "distance_km": 18.0, "base_time_min": 32, "base_cost": 216.0, "co2e_kg": 2.16, "timetable_json": '{"service":"sea-demo"}'},
    {"from_id": 4, "to_id": 7, "mode": "sea", "distance_km": 48.0, "base_time_min": 94, "base_cost": 192.0, "co2e_kg": 0.96, "timetable_json": '{"service":"coastal-demo"}'},
    {"from_id": 2, "to_id": 5, "mode": "road", "distance_km": 30.0, "base_time_min": 40, "base_cost": 360.0, "co2e_kg": 3.6, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 5, "to_id": 7, "mode": "air", "distance_km": 24.0, "base_time_min": 20, "base_cost": 1080.0, "co2e_kg": 14.4, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 1, "to_id": 7, "mode": "road", "distance_km": 24.0, "base_time_min": 40, "base_cost": 288.0, "co2e_kg": 2.88, "timetable_json": None},
]


def reset_demo_data() -> None:
    with SessionLocal() as db:
        db.execute(
            text(
                """
                TRUNCATE TABLE
                    plan_legs,
                    events,
                    plans,
                    shipments,
                    vehicles,
                    edges,
                    locations
                RESTART IDENTITY CASCADE
                """
            )
        )

        for location in DEMO_LOCATIONS:
            db.execute(
                text(
                    """
                    INSERT INTO locations (id, name, type, lat, lon)
                    VALUES (:id, :name, :type, :lat, :lon)
                    """
                ),
                location,
            )

        for vehicle in DEMO_VEHICLES:
            db.execute(
                text(
                    """
                    INSERT INTO vehicles
                        (id, mode, capacity_kg, capacity_m3, co2e_per_km, fixed_cost, variable_cost_per_km)
                    VALUES
                        (:id, :mode, :capacity_kg, :capacity_m3, :co2e_per_km, :fixed_cost, :variable_cost_per_km)
                    """
                ),
                vehicle,
            )

        for shipment in DEMO_SHIPMENTS:
            db.execute(
                text(
                    """
                    INSERT INTO shipments
                        (id, origin_id, destination_id, volume_m3, weight_kg, ready_time, due_time, priority)
                    VALUES
                        (:id, :origin_id, :destination_id, :volume_m3, :weight_kg, :ready_time, :due_time, :priority)
                    """
                ),
                shipment,
            )

        for edge in DEMO_EDGES:
            db.execute(
                text(
                    """
                    INSERT INTO edges
                        (from_id, to_id, mode, distance_km, base_time_min, base_cost, co2e_kg, timetable_json)
                    VALUES
                        (:from_id, :to_id, :mode, :distance_km, :base_time_min, :base_cost, :co2e_kg, CAST(:timetable_json AS JSONB))
                    """
                ),
                edge,
            )

        db.commit()


if __name__ == "__main__":
    reset_demo_data()
    print("Demo data reset complete.")
