from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def ping_db() -> bool:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return True
