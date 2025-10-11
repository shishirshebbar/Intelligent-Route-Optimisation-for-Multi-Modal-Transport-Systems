import os
from dotenv import load_dotenv
from pathlib import Path
# loads .env from project root when running locally
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

class Settings:
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://logi_user:logi_pass@localhost:5432/logistics")
    API_PREFIX: str = "/api/v1"

settings = Settings()
