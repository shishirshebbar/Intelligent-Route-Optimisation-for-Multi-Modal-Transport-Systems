-- Core entities
CREATE TABLE IF NOT EXISTS locations (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT CHECK (type IN ('depot','port','rail','airport','customer')) NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lon           DOUBLE PRECISION NOT NULL,
  geom          geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography) STORED
);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);

CREATE TABLE IF NOT EXISTS edges (
  id            SERIAL PRIMARY KEY,
  from_id       INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  to_id         INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  mode          TEXT CHECK (mode IN ('road','rail','sea','air','transfer')) NOT NULL,
  distance_km   DOUBLE PRECISION NOT NULL,
  base_time_min INT NOT NULL,
  base_cost     DOUBLE PRECISION NOT NULL,
  co2e_kg       DOUBLE PRECISION DEFAULT 0,
  timetable_json JSONB
);
CREATE INDEX IF NOT EXISTS idx_edges_mode ON edges(mode);

CREATE TABLE IF NOT EXISTS shipments (
  id            TEXT PRIMARY KEY,
  origin_id     INT NOT NULL REFERENCES locations(id),
  destination_id INT NOT NULL REFERENCES locations(id),
  volume_m3     DOUBLE PRECISION NOT NULL,
  weight_kg     DOUBLE PRECISION NOT NULL,
  ready_time    TIMESTAMPTZ NOT NULL,
  due_time      TIMESTAMPTZ NOT NULL,
  priority      INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_shipments_due_time ON shipments(due_time);

CREATE TABLE IF NOT EXISTS vehicles (
  id            TEXT PRIMARY KEY,
  mode          TEXT CHECK (mode IN ('road','rail','sea','air')) NOT NULL,
  capacity_kg   DOUBLE PRECISION NOT NULL,
  capacity_m3   DOUBLE PRECISION NOT NULL,
  co2e_per_km   DOUBLE PRECISION,
  fixed_cost    DOUBLE PRECISION DEFAULT 0,
  variable_cost_per_km DOUBLE PRECISION DEFAULT 0
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id            TEXT PRIMARY KEY,
  status        TEXT CHECK (status IN ('draft','active','rerouted','completed','failed')) DEFAULT 'draft',
  created_at    TIMESTAMPTZ DEFAULT now(),
  total_cost    DOUBLE PRECISION,
  total_time_min INT,
  total_co2e_kg DOUBLE PRECISION,
  details_json  JSONB
);

CREATE TABLE IF NOT EXISTS plan_legs (
  leg_id        TEXT PRIMARY KEY,
  plan_id       TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  shipment_id   TEXT REFERENCES shipments(id),
  mode          TEXT NOT NULL,
  from_id       INT REFERENCES locations(id),
  to_id         INT REFERENCES locations(id),
  distance_km   DOUBLE PRECISION,
  eta_start     TIMESTAMPTZ,
  eta_end       TIMESTAMPTZ,
  cost          DOUBLE PRECISION,
  co2e_kg       DOUBLE PRECISION,
  delay_min_pred DOUBLE PRECISION,
  uncertainty    DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_plan_legs_plan ON plan_legs(plan_id);

-- Events & telemetry
CREATE TABLE IF NOT EXISTS events (
  id            BIGSERIAL PRIMARY KEY,
  plan_id       TEXT REFERENCES plans(id),
  type          TEXT NOT NULL,
  ts            TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_json  JSONB
);

CREATE TABLE IF NOT EXISTS telemetry (
  id            BIGSERIAL PRIMARY KEY,
  vehicle_id    TEXT NOT NULL,
  ts            TIMESTAMPTZ NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lon           DOUBLE PRECISION NOT NULL,
  geom          geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography) STORED,
  speed_kph     DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_telemetry_geom ON telemetry USING GIST (geom);

-- External snapshots
CREATE TABLE IF NOT EXISTS weather_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  ts            TIMESTAMPTZ NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lon           DOUBLE PRECISION NOT NULL,
  temp_c        DOUBLE PRECISION,
  wind_mps      DOUBLE PRECISION,
  precip_mm     DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS traffic_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  ts            TIMESTAMPTZ NOT NULL,
  edge_id       INT REFERENCES edges(id),
  speed_ratio   DOUBLE PRECISION, -- observed/base
  incident      TEXT
);
