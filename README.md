step1 - clone the repo
step 2 - in frontend - npm i
to run in frontend - npm run dev
step 3 - in backend - npm i
to run in backend - python -m uvicorn app.main:app --reload
step 4- infra setup -- in root run - docker compose up -d db
to check - docker logs -f logistics_db
to connect ot pgsql - docker exec -it logistics_db psql -U logi_user -d logistics
