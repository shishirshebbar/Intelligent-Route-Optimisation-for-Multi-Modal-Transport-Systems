from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, JSONB
from app.db.base import Base

class Edge(Base):
    __tablename__ = "edges"

    id = Column(Integer, primary_key=True)
    from_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    to_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    mode = Column(Text, nullable=False)  # road|rail|sea|air|transfer
    distance_km = Column(DOUBLE_PRECISION, nullable=False)
    base_time_min = Column(Integer, nullable=False)
    base_cost = Column(DOUBLE_PRECISION, nullable=False)
    co2e_kg = Column(DOUBLE_PRECISION, nullable=True)
    timetable_json = Column(JSONB, nullable=True)
