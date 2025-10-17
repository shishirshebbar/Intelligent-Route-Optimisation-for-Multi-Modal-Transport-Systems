# Intelligent Route Optimisation for Multi-Modal Transport Systems

Quick start instructions (commands shown in code blocks):

## 1. Clone the repo
```bash
git clone <repo-url>
cd Intelligent-Route-Optimisation-for-Multi-Modal-Transport-Systems
```

## 2. Install dependencies
```bash
npm i
```

## 3. Run the frontend
```bash
npm run dev
```

## 4. Run the backend
```bash
python -m uvicorn app.main:app --reload
```

## 5. Infrastructure setup
```bash
docker compose up -d db
```

## 6. Check the logs
```bash
docker logs -f logistics_db
```

## 7. Connect to PostgreSQL
```bash
docker exec -it logistics_db psql -U logi_user -d logistics
```
