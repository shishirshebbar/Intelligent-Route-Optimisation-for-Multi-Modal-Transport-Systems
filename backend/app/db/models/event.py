# backend/app/db/models/event.py
from sqlalchemy import Column, BigInteger, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB
from sqlalchemy.sql import func
from app.db.base import Base

class Event(Base):
    __tablename__ = "events"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    plan_id = Column(Text, nullable=True)     # <- removed ForeignKey
    type = Column(Text, nullable=False)
    source = Column(Text, nullable=True)
    severity = Column(Text, nullable=True)
    payload_json = Column(JSONB, nullable=True)
    ts = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
