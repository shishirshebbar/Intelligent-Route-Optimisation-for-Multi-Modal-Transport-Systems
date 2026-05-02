from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import text

from app.db.session import SessionLocal


DEMO_LOCATIONS = [
    {"id": 1, "name": "WH-A", "type": "depot", "lat": 12.9716, "lon": 77.5946},
    {"id": 2, "name": "WH-B", "type": "depot", "lat": 12.9352, "lon": 77.6245},
    {"id": 3, "name": "WH-C", "type": "depot", "lat": 13.0827, "lon": 80.2707},
    {"id": 4, "name": "WH-D", "type": "depot", "lat": 17.3850, "lon": 78.4867},
    {"id": 5, "name": "Rail-Yard", "type": "rail", "lat": 12.9991, "lon": 77.5700},
    {"id": 6, "name": "Rail-East", "type": "rail", "lat": 13.0820, "lon": 80.2750},
    {"id": 7, "name": "Rail-Hub-HYD", "type": "rail", "lat": 17.4200, "lon": 78.4800},
    {"id": 8, "name": "Port-Z", "type": "port", "lat": 13.0500, "lon": 77.5500},
    {"id": 9, "name": "Port-Chennai", "type": "port", "lat": 13.1067, "lon": 80.3206},
    {"id": 10, "name": "Port-Vizag", "type": "port", "lat": 17.6868, "lon": 83.2185},
    {"id": 11, "name": "Airport-Hub", "type": "airport", "lat": 13.1986, "lon": 77.7066},
    {"id": 12, "name": "Airport-Chennai", "type": "airport", "lat": 12.9941, "lon": 80.1709},
    {"id": 13, "name": "Airport-HYD", "type": "airport", "lat": 17.2403, "lon": 78.4294},
    {"id": 14, "name": "Customer-North", "type": "customer", "lat": 13.0358, "lon": 77.5970},
    {"id": 15, "name": "Customer-South", "type": "customer", "lat": 12.9081, "lon": 77.6476},
    {"id": 16, "name": "Customer-East", "type": "customer", "lat": 12.9908, "lon": 77.7196},
    {"id": 17, "name": "Customer-West", "type": "customer", "lat": 12.9550, "lon": 77.5250},
    {"id": 18, "name": "Customer-Central-Chennai", "type": "customer", "lat": 13.0674, "lon": 80.2376},
    {"id": 19, "name": "Customer-South-Chennai", "type": "customer", "lat": 12.9719, "lon": 80.2206},
    {"id": 20, "name": "Customer-HYD-North", "type": "customer", "lat": 17.4933, "lon": 78.3915},
    {"id": 21, "name": "Customer-HYD-East", "type": "customer", "lat": 17.4500, "lon": 78.5500},
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
        "destination_id": 14,
        "volume_m3": 4.0,
        "weight_kg": 850.0,
        "ready_time": datetime(2026, 3, 17, 8, 0, tzinfo=timezone.utc),
        "due_time": datetime(2026, 3, 17, 14, 0, tzinfo=timezone.utc),
        "priority": 2,
    },
    {
        "id": "S2",
        "origin_id": 2,
        "destination_id": 15,
        "volume_m3": 6.5,
        "weight_kg": 1400.0,
        "ready_time": datetime(2026, 3, 17, 9, 0, tzinfo=timezone.utc),
        "due_time": datetime(2026, 3, 17, 18, 0, tzinfo=timezone.utc),
        "priority": 3,
    },
    {
        "id": "S3",
        "origin_id": 1,
        "destination_id": 15,
        "volume_m3": 3.2,
        "weight_kg": 620.0,
        "ready_time": datetime(2026, 3, 17, 7, 30, tzinfo=timezone.utc),
        "due_time": datetime(2026, 3, 17, 13, 30, tzinfo=timezone.utc),
        "priority": 1,
    },
    {"id": "S4", "origin_id": 1, "destination_id": 16, "volume_m3": 5.8, "weight_kg": 1200.0, "ready_time": datetime(2026, 3, 17, 6, 45, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 17, 15, tzinfo=timezone.utc), "priority": 2},
    {"id": "S5", "origin_id": 2, "destination_id": 17, "volume_m3": 8.0, "weight_kg": 1850.0, "ready_time": datetime(2026, 3, 17, 10, 0, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 22, 0, tzinfo=timezone.utc), "priority": 3},
    {"id": "S6", "origin_id": 3, "destination_id": 18, "volume_m3": 4.5, "weight_kg": 980.0, "ready_time": datetime(2026, 3, 17, 8, 20, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 19, 30, tzinfo=timezone.utc), "priority": 2},
    {"id": "S7", "origin_id": 3, "destination_id": 19, "volume_m3": 7.1, "weight_kg": 1650.0, "ready_time": datetime(2026, 3, 17, 5, 45, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 16, 30, tzinfo=timezone.utc), "priority": 1},
    {"id": "S8", "origin_id": 4, "destination_id": 20, "volume_m3": 6.8, "weight_kg": 1520.0, "ready_time": datetime(2026, 3, 17, 9, 10, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 21, 10, tzinfo=timezone.utc), "priority": 2},
    {"id": "S9", "origin_id": 4, "destination_id": 21, "volume_m3": 9.4, "weight_kg": 2100.0, "ready_time": datetime(2026, 3, 17, 7, 0, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 20, 45, tzinfo=timezone.utc), "priority": 3},
    {"id": "S10", "origin_id": 1, "destination_id": 17, "volume_m3": 2.8, "weight_kg": 540.0, "ready_time": datetime(2026, 3, 17, 11, 0, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 15, 0, tzinfo=timezone.utc), "priority": 1},
    {"id": "S11", "origin_id": 2, "destination_id": 16, "volume_m3": 3.6, "weight_kg": 760.0, "ready_time": datetime(2026, 3, 17, 12, 30, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 18, 45, tzinfo=timezone.utc), "priority": 2},
    {"id": "S12", "origin_id": 3, "destination_id": 19, "volume_m3": 5.2, "weight_kg": 1100.0, "ready_time": datetime(2026, 3, 17, 6, 20, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 18, 10, tzinfo=timezone.utc), "priority": 2},
    {"id": "S13", "origin_id": 4, "destination_id": 20, "volume_m3": 4.9, "weight_kg": 1030.0, "ready_time": datetime(2026, 3, 17, 8, 40, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 19, 0, tzinfo=timezone.utc), "priority": 2},
    {"id": "S14", "origin_id": 1, "destination_id": 18, "volume_m3": 6.0, "weight_kg": 1300.0, "ready_time": datetime(2026, 3, 17, 9, 25, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 20, 30, tzinfo=timezone.utc), "priority": 3},
    {"id": "S15", "origin_id": 2, "destination_id": 21, "volume_m3": 7.5, "weight_kg": 1725.0, "ready_time": datetime(2026, 3, 17, 7, 50, tzinfo=timezone.utc), "due_time": datetime(2026, 3, 17, 21, 45, tzinfo=timezone.utc), "priority": 3},
]

DEMO_EDGES = [
    {"from_id": 1, "to_id": 14, "mode": "road", "distance_km": 18.0, "base_time_min": 32, "base_cost": 216.0, "co2e_kg": 2.16, "timetable_json": None},
    {"from_id": 1, "to_id": 5, "mode": "road", "distance_km": 12.0, "base_time_min": 20, "base_cost": 144.0, "co2e_kg": 1.44, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 5, "to_id": 14, "mode": "rail", "distance_km": 28.0, "base_time_min": 24, "base_cost": 168.0, "co2e_kg": 1.12, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 1, "to_id": 8, "mode": "road", "distance_km": 16.0, "base_time_min": 28, "base_cost": 192.0, "co2e_kg": 1.92, "timetable_json": '{"service":"sea-demo"}'},
    {"from_id": 8, "to_id": 14, "mode": "sea", "distance_km": 44.0, "base_time_min": 88, "base_cost": 176.0, "co2e_kg": 0.88, "timetable_json": '{"service":"coastal-demo"}'},
    {"from_id": 1, "to_id": 11, "mode": "road", "distance_km": 34.0, "base_time_min": 46, "base_cost": 408.0, "co2e_kg": 4.08, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 11, "to_id": 14, "mode": "air", "distance_km": 22.0, "base_time_min": 18, "base_cost": 990.0, "co2e_kg": 13.2, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 2, "to_id": 15, "mode": "road", "distance_km": 16.0, "base_time_min": 30, "base_cost": 192.0, "co2e_kg": 1.92, "timetable_json": None},
    {"from_id": 2, "to_id": 5, "mode": "road", "distance_km": 14.0, "base_time_min": 24, "base_cost": 168.0, "co2e_kg": 1.68, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 5, "to_id": 15, "mode": "rail", "distance_km": 24.0, "base_time_min": 22, "base_cost": 144.0, "co2e_kg": 0.96, "timetable_json": '{"service":"rail-demo"}'},
    {"from_id": 2, "to_id": 8, "mode": "road", "distance_km": 18.0, "base_time_min": 32, "base_cost": 216.0, "co2e_kg": 2.16, "timetable_json": '{"service":"sea-demo"}'},
    {"from_id": 8, "to_id": 15, "mode": "sea", "distance_km": 48.0, "base_time_min": 94, "base_cost": 192.0, "co2e_kg": 0.96, "timetable_json": '{"service":"coastal-demo"}'},
    {"from_id": 2, "to_id": 11, "mode": "road", "distance_km": 30.0, "base_time_min": 40, "base_cost": 360.0, "co2e_kg": 3.6, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 11, "to_id": 15, "mode": "air", "distance_km": 24.0, "base_time_min": 20, "base_cost": 1080.0, "co2e_kg": 14.4, "timetable_json": '{"service":"air-demo"}'},
    {"from_id": 1, "to_id": 15, "mode": "road", "distance_km": 24.0, "base_time_min": 40, "base_cost": 288.0, "co2e_kg": 2.88, "timetable_json": None},
    {"from_id": 1, "to_id": 16, "mode": "road", "distance_km": 26.0, "base_time_min": 42, "base_cost": 312.0, "co2e_kg": 3.12, "timetable_json": None},
    {"from_id": 2, "to_id": 17, "mode": "road", "distance_km": 20.0, "base_time_min": 34, "base_cost": 240.0, "co2e_kg": 2.40, "timetable_json": None},
    {"from_id": 1, "to_id": 17, "mode": "road", "distance_km": 14.0, "base_time_min": 26, "base_cost": 168.0, "co2e_kg": 1.68, "timetable_json": None},
    {"from_id": 2, "to_id": 16, "mode": "road", "distance_km": 15.0, "base_time_min": 28, "base_cost": 180.0, "co2e_kg": 1.80, "timetable_json": None},
    {"from_id": 5, "to_id": 18, "mode": "rail", "distance_km": 340.0, "base_time_min": 320, "base_cost": 2040.0, "co2e_kg": 13.60, "timetable_json": '{"service":"blr-maa-rail"}'},
    {"from_id": 5, "to_id": 20, "mode": "rail", "distance_km": 650.0, "base_time_min": 560, "base_cost": 3900.0, "co2e_kg": 26.00, "timetable_json": '{"service":"blr-hyd-rail"}'},
    {"from_id": 8, "to_id": 18, "mode": "sea", "distance_km": 365.0, "base_time_min": 720, "base_cost": 1460.0, "co2e_kg": 7.30, "timetable_json": '{"service":"coastal-maa"}'},
    {"from_id": 8, "to_id": 10, "mode": "sea", "distance_km": 780.0, "base_time_min": 1320, "base_cost": 3120.0, "co2e_kg": 15.60, "timetable_json": '{"service":"coastal-vtz"}'},
    {"from_id": 11, "to_id": 12, "mode": "air", "distance_km": 295.0, "base_time_min": 64, "base_cost": 13275.0, "co2e_kg": 177.0, "timetable_json": '{"service":"blr-maa-air"}'},
    {"from_id": 11, "to_id": 13, "mode": "air", "distance_km": 520.0, "base_time_min": 70, "base_cost": 23400.0, "co2e_kg": 312.0, "timetable_json": '{"service":"maa-hyd-air"}'},
    {"from_id": 14, "to_id": 16, "mode": "road", "distance_km": 18.0, "base_time_min": 34, "base_cost": 216.0, "co2e_kg": 2.16, "timetable_json": None},
    {"from_id": 14, "to_id": 17, "mode": "road", "distance_km": 22.0, "base_time_min": 38, "base_cost": 264.0, "co2e_kg": 2.64, "timetable_json": None},
    {"from_id": 15, "to_id": 16, "mode": "road", "distance_km": 19.0, "base_time_min": 35, "base_cost": 228.0, "co2e_kg": 2.28, "timetable_json": None},
    {"from_id": 6, "to_id": 18, "mode": "road", "distance_km": 16.0, "base_time_min": 28, "base_cost": 192.0, "co2e_kg": 1.92, "timetable_json": None},
    {"from_id": 6, "to_id": 19, "mode": "road", "distance_km": 20.0, "base_time_min": 36, "base_cost": 240.0, "co2e_kg": 2.40, "timetable_json": None},
    {"from_id": 6, "to_id": 14, "mode": "road", "distance_km": 345.0, "base_time_min": 520, "base_cost": 4140.0, "co2e_kg": 41.40, "timetable_json": None},
    {"from_id": 6, "to_id": 15, "mode": "road", "distance_km": 358.0, "base_time_min": 540, "base_cost": 4296.0, "co2e_kg": 42.96, "timetable_json": None},
    {"from_id": 9, "to_id": 18, "mode": "sea", "distance_km": 22.0, "base_time_min": 80, "base_cost": 88.0, "co2e_kg": 0.44, "timetable_json": '{"service":"harbor-feeder"}'},
    {"from_id": 9, "to_id": 19, "mode": "road", "distance_km": 28.0, "base_time_min": 48, "base_cost": 336.0, "co2e_kg": 3.36, "timetable_json": None},
    {"from_id": 10, "to_id": 18, "mode": "road", "distance_km": 35.0, "base_time_min": 58, "base_cost": 420.0, "co2e_kg": 4.20, "timetable_json": None},
    {"from_id": 12, "to_id": 19, "mode": "road", "distance_km": 12.0, "base_time_min": 24, "base_cost": 144.0, "co2e_kg": 1.44, "timetable_json": None},
    {"from_id": 12, "to_id": 18, "mode": "road", "distance_km": 30.0, "base_time_min": 52, "base_cost": 360.0, "co2e_kg": 3.60, "timetable_json": None},
    {"from_id": 13, "to_id": 20, "mode": "road", "distance_km": 24.0, "base_time_min": 42, "base_cost": 288.0, "co2e_kg": 2.88, "timetable_json": None},
    {"from_id": 13, "to_id": 21, "mode": "road", "distance_km": 26.0, "base_time_min": 44, "base_cost": 312.0, "co2e_kg": 3.12, "timetable_json": None},
    {"from_id": 13, "to_id": 18, "mode": "road", "distance_km": 16.0, "base_time_min": 30, "base_cost": 192.0, "co2e_kg": 1.92, "timetable_json": None},
    {"from_id": 13, "to_id": 19, "mode": "road", "distance_km": 18.0, "base_time_min": 32, "base_cost": 216.0, "co2e_kg": 2.16, "timetable_json": None},
    {"from_id": 13, "to_id": 17, "mode": "road", "distance_km": 22.0, "base_time_min": 38, "base_cost": 264.0, "co2e_kg": 2.64, "timetable_json": None},
]

DEMO_EVENTS = [
    {
        "type": "weather",
        "source": "open-meteo",
        "severity": "moderate",
        "ts": datetime(2026, 3, 17, 6, 45, tzinfo=timezone.utc),
        "payload_json": '{"location_id":1,"location_name":"WH-A","temperature_c":24.5,"precipitation_mm":3.1,"wind_speed_mps":6.4,"note":"Light rain near departure depot"}',
    },
    {
        "type": "traffic",
        "source": "stub-traffic",
        "severity": "high",
        "ts": datetime(2026, 3, 17, 7, 5, tzinfo=timezone.utc),
        "payload_json": '{"location_id":15,"location_name":"Customer-South","congestion_index":0.81,"avg_speed_kph":18.0,"note":"Morning congestion on approach corridor"}',
    },
    {
        "type": "fuel_price",
        "source": "market-feed",
        "severity": "low",
        "ts": datetime(2026, 3, 17, 7, 30, tzinfo=timezone.utc),
        "payload_json": '{"region":"KA","price_inr_per_l":104.2,"note":"Fuel cost updated for Bengaluru region"}',
    },
    {
        "type": "reroute",
        "source": "reroute-engine",
        "severity": "moderate",
        "ts": datetime(2026, 3, 17, 8, 0, tzinfo=timezone.utc),
        "payload_json": '{"plan_id":"demo_plan_01","note":"Suggested diversion to reduce delay exposure"}',
    },
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

        for event in DEMO_EVENTS:
            db.execute(
                text(
                    """
                    INSERT INTO events
                        (type, source, severity, ts, payload_json)
                    VALUES
                        (:type, :source, :severity, :ts, CAST(:payload_json AS JSONB))
                    """
                ),
                event,
            )

        db.commit()


if __name__ == "__main__":
    reset_demo_data()
    print("Demo data reset complete.")
