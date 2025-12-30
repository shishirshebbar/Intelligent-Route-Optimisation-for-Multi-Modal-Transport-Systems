
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.network import router as network_router
from app.config.settings import settings
from app.api.v1.routes.shipments import router as shipments_router
from app.api.v1.routes.plans import router as plans_router
from app.api.v1.routes.routing import router as routing_router
from app.api.v1.routes.events import router as events_router
import os
from app.db.session import engine
from app.db.base import Base
from app.api.v1.routes.metrics import router as metrics_router

# 🔴 REQUIRED: import models so SQLAlchemy sees them
import app.db.models.plan
import app.db.models.plan_leg
def create_app() -> FastAPI:
    app = FastAPI(
        title="Adaptive Multimodal Logistics API",
        version="0.1.0",
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
        docs_url=f"{settings.API_PREFIX}/docs",
        redoc_url=f"{settings.API_PREFIX}/redoc",
    )

    # CORS (adjust origins for your frontend port)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],  # tighten later
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health_router, prefix=settings.API_PREFIX)
    app.include_router(network_router, prefix=settings.API_PREFIX)
    
    app.include_router(shipments_router, prefix=settings.API_PREFIX)
    app.include_router(plans_router, prefix=settings.API_PREFIX)
    app.include_router(routing_router, prefix=settings.API_PREFIX)
    app.include_router(events_router, prefix=settings.API_PREFIX)
    app.include_router(metrics_router, prefix=settings.API_PREFIX)

    print(">> DATABASE_URL:", settings.DATABASE_URL)
    @app.get("/")
    def root():
        return {"message": "Adaptive Logistics backend is running", "docs": f"{settings.API_PREFIX}/docs"}

    return app

app = create_app()
Base.metadata.create_all(bind=engine)
