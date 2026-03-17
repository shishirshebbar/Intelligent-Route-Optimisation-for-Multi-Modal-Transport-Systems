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

INSERT INTO edges (from_id, to_id, mode, distance_km, base_time_min, base_cost, co2e_kg, timetable_json) VALUES
(1, 6, 'road', 18.0, 32, 216.0, 2.16, NULL),
(1, 3, 'road', 12.0, 20, 144.0, 1.44, NULL),
(3, 6, 'rail', 28.0, 24, 168.0, 1.12, '{"service":"rail-demo"}'),
(1, 4, 'road', 16.0, 28, 192.0, 1.92, NULL),
(4, 6, 'sea', 44.0, 88, 176.0, 0.88, '{"service":"coastal-demo"}'),
(1, 5, 'road', 34.0, 46, 408.0, 4.08, NULL),
(5, 6, 'air', 22.0, 18, 990.0, 13.2, '{"service":"air-demo"}'),
(2, 7, 'road', 16.0, 30, 192.0, 1.92, NULL),
(2, 3, 'road', 14.0, 24, 168.0, 1.68, NULL),
(3, 7, 'rail', 24.0, 22, 144.0, 0.96, '{"service":"rail-demo"}'),
(2, 4, 'road', 18.0, 32, 216.0, 2.16, NULL),
(4, 7, 'sea', 48.0, 94, 192.0, 0.96, '{"service":"coastal-demo"}'),
(2, 5, 'road', 30.0, 40, 360.0, 3.6, NULL),
(5, 7, 'air', 24.0, 20, 1080.0, 14.4, '{"service":"air-demo"}'),
(1, 7, 'road', 24.0, 40, 288.0, 2.88, NULL)
ON CONFLICT DO NOTHING;
