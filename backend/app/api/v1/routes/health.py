from fastapi import APIRouter
from app.db.session import ping_db

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    try:
        ping_db()
        return {"status": "ok", "db": True}
    except Exception as e:
        return {"status": "degraded", "db": False, "error": str(e)}
