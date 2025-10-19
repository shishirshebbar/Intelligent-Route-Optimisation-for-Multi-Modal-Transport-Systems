# backend/app/dev/test_traffic.py
from app.services.traffic_client import get_area_traffic, get_edge_factor

snap = get_area_traffic(12.9716, 77.5946)
print("Area:", snap)

pen = get_edge_factor("E-1001", base_travel_time_min=12.0, lat=12.9716, lon=77.5946, rain_mm=0.8)
print("Edge penalty:", pen)
