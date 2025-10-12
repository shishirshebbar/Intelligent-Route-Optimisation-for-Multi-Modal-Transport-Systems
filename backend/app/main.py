from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.network import router as network_router
import os
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
    print("DB URL:", os.getenv("DATABASE_URL"))
    @app.get("/")
    def root():
        return {"message": "Adaptive Logistics backend is running", "docs": f"{settings.API_PREFIX}/docs"}

    return app

app = create_app()
