from sqlalchemy import Column, Float, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime
from sqlalchemy import Boolean, Text, Column

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Text, primary_key=True)

    # ✅ ADD THESE
    status = Column(Text, nullable=False, default="draft")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    details_json = Column(JSONB, nullable=True)

    # existing fields
    total_distance_km = Column(Float, nullable=False, default=0.0)
    total_time_min = Column(Float, nullable=False, default=0.0)
    total_co2e_kg = Column(Float, nullable=False, default=0.0)

    # ML outputs
    delay_prob = Column(Float, nullable=True)
    expected_delay_min = Column(Float, nullable=True)

    legs = relationship(
        "PlanLeg",
        back_populates="plan",
        cascade="all, delete-orphan"
    )
    
    was_rerouted = Column(Boolean, default=False)
    reroute_reason = Column(Text, nullable=True)

