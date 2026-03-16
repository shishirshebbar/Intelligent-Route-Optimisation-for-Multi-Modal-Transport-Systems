INSERT INTO locations (name,type,lat,lon) VALUES
('WH-A','depot',12.9716,77.5946),
('WH-B','depot',12.9352,77.6245),
('Rail-Yard','rail',12.9991,77.5700),
('Port-Z','port',13.0500,77.5500),
('Airport-Hub','airport',13.1986,77.7066),
('Customer-North','customer',13.0358,77.5970),
('Customer-South','customer',12.9081,77.6476)
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (id,mode,capacity_kg,capacity_m3,co2e_per_km)
VALUES ('V-1','road',10000,30,0.85)
ON CONFLICT DO NOTHING;

INSERT INTO shipments (id, origin_id, destination_id, volume_m3, weight_kg, ready_time, due_time, priority) VALUES
('S1', 1, 6, 4.0, 850.0, '2026-03-16T08:00:00Z', '2026-03-16T14:00:00Z', 2),
('S2', 2, 7, 6.5, 1400.0, '2026-03-16T09:00:00Z', '2026-03-16T18:00:00Z', 3),
('S3', 1, 7, 3.2, 620.0, '2026-03-16T07:30:00Z', '2026-03-16T13:30:00Z', 1)
ON CONFLICT (id) DO NOTHING;
