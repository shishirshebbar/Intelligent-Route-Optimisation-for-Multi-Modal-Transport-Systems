from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, INTEGER, TIMESTAMP, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Text, primary_key=True)
    status = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True))
    total_cost = Column(DOUBLE_PRECISION)
    total_time_min = Column(INTEGER)
    total_co2e_kg = Column(DOUBLE_PRECISION)
    details_json = Column(JSONB)

    # string reference avoids import cycles
    legs = relationship("PlanLeg", back_populates="plan", cascade="all, delete-orphan")
