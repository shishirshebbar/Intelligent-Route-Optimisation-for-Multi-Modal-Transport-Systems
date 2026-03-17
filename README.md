# Intelligent Route Optimisation for Multi-Modal Transport Systems

An end-to-end logistics demo that combines:
- FastAPI backend APIs
- React control-tower dashboard
- PostgreSQL/PostGIS data layer
- OSRM road routing
- an ML delay prediction microservice
- weather, traffic, and reroute worker loops

For the current demo:
- `road` mode uses OSRM when available
- `rail`, `sea`, and `air` use heuristic mode parameters
- the dashboard uses seeded shipments and locations out of the box

## Demo Architecture
- `backend/`: APIs for network, shipments, plans, routing, events, and metrics
- `frontend/`: dashboard for routes, KPIs, events, and delay charts
- `ml/delay_service/`: FastAPI service serving the trained delay model
- `infra/`: Postgres/PostGIS and OSRM setup
- `backend/app/workers/`: weather, traffic, and reroute event loops

## 1. Clone the repo
```bash
git clone https://github.com/shishirshebbar/Intelligent-Route-Optimisation-for-Multi-Modal-Transport-Systems.git
cd Intelligent-Route-Optimisation-for-Multi-Modal-Transport-Systems
```

## 2. Create the root `.env`
```env
POSTGRES_USER=logi_user
POSTGRES_PASSWORD=logi_pass
POSTGRES_DB=logistics
POSTGRES_PORT=5433
APP_PORT=8000
APP_HOST=0.0.0.0

DATABASE_URL=postgresql+psycopg2://logi_user:logi_pass@127.0.0.1:5433/logistics

OSRM_URL=http://localhost:5000
OPEN_METEO_BASE=https://api.open-meteo.com/v1/forecast
WEATHER_HTTP_TIMEOUT=10
WEATHER_POLL_SECONDS=300
WEATHER_LOCATION_TYPES=depot,port,airport
TRAFFIC_POLL_SECONDS=300
TRAFFIC_LOCATION_TYPES=depot,customer
ML_DELAY_URL=http://localhost:51000
ML_DELAY_TIMEOUT=5
```

## 3. Create `frontend/.env`
```env
VITE_API_BASE=/api/v1
```

## 4. Prepare OSRM data
Download a `.osm.pbf` file from Geofabrik and place it in `data/` as:
```text
data/region.osm.pbf
```

Then preprocess it:
```bash
cd infra/osrm
docker run --rm -v "$PWD:/data" osrm/osrm-backend:v5.27.0 osrm-extract -p /data/profiles/car.lua /data/data/region.osm.pbf
docker run --rm -v "$PWD:/data" osrm/osrm-backend:v5.27.0 osrm-partition /data/data/region.osrm
docker run --rm -v "$PWD:/data" osrm/osrm-backend:v5.27.0 osrm-customize /data/data/region.osrm
cd ../..
```

## 5. Start infrastructure
```bash
docker compose up -d db osrm
```

The seeded schema includes demo locations and shipments such as `S1`, `S2`, and `S3`.

## 6. Start the ML delay service
```bash
cd ml/delay_service
uvicorn app:app --port 51000
```

## 7. Start the backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## 8. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

## 9. Start live event workers
Open separate terminals inside `backend/` and run:

Optional but recommended before every demo, to reset the dashboard to a clean dataset:
```bash
python -m app.dev.reset_demo_data
```

Weather worker:
```bash
python -m app.workers.ingest_weather --once
```
or continuous mode:
```bash
python -m app.workers.ingest_weather
```

Traffic worker:
```bash
python -m app.workers.ingest_traffic --once
```
or continuous mode:
```bash
python -m app.workers.ingest_traffic
```

Reroute engine:
```bash
python -m app.workers.reroute_engine
```

## 10. Verify services
- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:8000/api/v1/docs`
- ML docs: `http://localhost:51000/docs`

Quick OSRM check:
```bash
curl "http://localhost:5000/route/v1/driving/76.27,10.00;76.50,10.10?overview=false"
```

## 11. Full demo flow
1. Open the dashboard.
2. Select a seeded shipment.
3. Keep mode as `road` to use OSRM-backed routing.
4. Click `Compute Route`.
5. The app will:
   - fetch a route
   - create an active plan
   - call the ML delay service
   - display distance, ETA, CO2e, and expected delay
6. Run the weather and traffic workers to populate the live events panel.
7. Keep the reroute worker running to emit reroute events when severe traffic or weather events appear.

## 12. What is real vs heuristic
Real in the current demo:
- road routing via OSRM
- shipment-backed plan creation
- ML delay prediction service
- weather ingestion from Open-Meteo
- traffic event generation
- event feed and reroute event persistence

Heuristic in the current demo:
- rail/sea/air routing
- optimisation scoring weights
- evaluation metrics used for research comparison

## 13. Current best demo mode
For the smoothest live demo, use:
- `road` mode
- seeded shipments
- one-shot weather and traffic worker runs before presenting
- reroute worker running in the background
