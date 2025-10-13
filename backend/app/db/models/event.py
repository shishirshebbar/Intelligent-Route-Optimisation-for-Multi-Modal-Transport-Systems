# backend/app/db/models/event.py
from sqlalchemy import Column, BigInteger, Text, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB
from app.db.base import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(BigInteger, primary_key=True)
    plan_id = Column(Text, ForeignKey("plans.id"), nullable=True)
    type = Column(Text, nullable=False)         # traffic|weather|fuel_price|breakdown
    ts = Column(TIMESTAMP(timezone=True), nullable=False)
    payload_json = Column(JSONB, nullable=True)
