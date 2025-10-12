import os
from pathlib import Path
from dotenv import load_dotenv
ROOT = Path(__file__).resolve().parents[3]  # project root
load_dotenv(ROOT / ".env")                  # force-load root .env

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://logi_user:logi_pass@127.0.0.1:5433/logistics",
    )
    API_PREFIX: str = "/api/v1"
settings = Settings()
