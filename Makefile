# Makefile — helper commands for local dev

# Run the database container
db.up:
	docker compose up -d db

# Stop everything
db.down:
	docker compose down

# Open a psql shell into the running Postgres container
db.psql:
	docker exec -it logistics_db psql -U logi_user -d logistics

# Recreate the database (drops volume)
db.reset:
	docker compose down -v
	docker compose up -d db

# Run backend FastAPI server
backend:
	cd backend && uvicorn app.main:app --reload

# Run frontend dev server
frontend:
	cd frontend && npm run dev

# Run both backend & frontend in detached mode
stack.up:
	docker compose up -d





# make db.up        # start Postgres
# make db.psql      # open SQL shell
# make backend      # run FastAPI locally
# make frontend     # run frontend
# make db.reset     # rebuild database (dangerous - clears data)
