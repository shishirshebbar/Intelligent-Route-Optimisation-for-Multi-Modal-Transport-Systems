# backend/app/db/models/plan.py
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, INTEGER, TIMESTAMP, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Text, primary_key=True)
    status = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True))
    total_cost = Column(DOUBLE_PRECISION, nullable=True)
    total_time_min = Column(INTEGER, nullable=True)
    total_co2e_kg = Column(DOUBLE_PRECISION, nullable=True)
    details_json = Column(JSONB, nullable=True)

    legs = relationship("PlanLeg", back_populates="plan", cascade="all, delete-orphan")
