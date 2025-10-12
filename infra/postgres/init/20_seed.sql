INSERT INTO locations (name,type,lat,lon) VALUES
('WH-A','depot',12.9716,77.5946),
('Rail-Yard','rail',12.9991,77.5700),
('Port-Z','port',13.0500,77.5500)
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (id,mode,capacity_kg,capacity_m3,co2e_per_km)
VALUES ('V-1','road',10000,30,0.85)
ON CONFLICT DO NOTHING;
