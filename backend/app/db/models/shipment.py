from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, TIMESTAMP
from app.db.base import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Text, primary_key=True)
    origin_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    destination_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    volume_m3 = Column(DOUBLE_PRECISION, nullable=False)
    weight_kg = Column(DOUBLE_PRECISION, nullable=False)
    ready_time = Column(TIMESTAMP(timezone=True), nullable=False)
    due_time = Column(TIMESTAMP(timezone=True), nullable=False)
    priority = Column(Integer, nullable=True)
