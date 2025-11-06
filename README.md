# Intelligent Route Optimisation for Multi-Modal Transport Systems

Quick start instructions (commands shown in code blocks):

## 1. Clone the repo
```bash
git clone <repo-url>
cd Intelligent-Route-Optimisation-for-Multi-Modal-Transport-Systems
```

## 2. for .env files 


create a .env file in the root(copy this):

```bash
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
```

next in the frontend directory - create a .env file(copy this):

```bash
VITE_API_BASE=/api/v1
```

## 3. Download osrm data from -  https://download.geofabrik.de/asia/india/southern-zone.html and place it in the data folder

rename the downloaded folder as region.osm.pbf

then in terminal 

```bash
cd infra/osrm
docker run --rm -v "$PWD:/data" osrm/osrm-backend:v5.27.0 \
  osrm-extract -p /data/profiles/car.lua /data/data/region.osm.pbf
docker run --rm -v "$PWD:/data" osrm/osrm-backend:v5.27.0 \
  osrm-partition /data/data/region.osrm
docker run --rm -v "$PWD:/data" osrm/osrm-backend:v5.27.0 \
  osrm-customize /data/data/region.osrm
cd ../..


```

## 4. Infrastructure setup
```bash
docker compose up -d db osrm
```

## 5. Check the logs
```bash
docker logs -f logistics_db
```

## 6. Connect to PostgreSQL
```bash
docker exec -it logistics_db psql -U logi_user -d logistics
```
## 7. Verify if everything is working

Frontend: http://localhost:5173

Backend Docs: http://localhost:8000/docs  -  this opens swagger ui

OSRM quick check(from root terminal):
```bash
curl "http://localhost:5000/route/v1/driving/76.27,10.00;76.50,10.10?overview=false"
```


## 8. For the frontend
```bash
cd frontend
```
```bash
npm i
```
```bash
npm run dev
```

## 9. Run the backend
```bash
cd backend
```
```bash
pip install -r requirements.txt
```
```bash
python -m uvicorn app.main:app --reload
```