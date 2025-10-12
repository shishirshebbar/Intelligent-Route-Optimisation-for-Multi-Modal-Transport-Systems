from sqlalchemy import Column, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db.base import Base

class PlanLeg(Base):
    __tablename__ = "plan_legs"

    leg_id = Column(Text, primary_key=True)
    plan_id = Column(Text, ForeignKey("plans.id", ondelete="CASCADE"), nullable=False)
    shipment_id = Column(Text, ForeignKey("shipments.id"))
    mode = Column(Text, nullable=False)
    from_id = Column(Integer, ForeignKey("locations.id"))
    to_id = Column(Integer, ForeignKey("locations.id"))
    distance_km = Column(DOUBLE_PRECISION)
    eta_start = Column(TIMESTAMP(timezone=True))
    eta_end = Column(TIMESTAMP(timezone=True))
    cost = Column(DOUBLE_PRECISION)
    co2e_kg = Column(DOUBLE_PRECISION)
    delay_min_pred = Column(DOUBLE_PRECISION)
    uncertainty = Column(DOUBLE_PRECISION)

    plan = relationship("Plan", back_populates="legs")
