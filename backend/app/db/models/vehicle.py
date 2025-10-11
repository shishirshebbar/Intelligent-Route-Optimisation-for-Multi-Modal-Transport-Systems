from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from app.db.base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Text, primary_key=True)
    mode = Column(Text, nullable=False)  # road|rail|sea|air
    capacity_kg = Column(DOUBLE_PRECISION, nullable=False)
    capacity_m3 = Column(DOUBLE_PRECISION, nullable=False)
    co2e_per_km = Column(DOUBLE_PRECISION, nullable=True)
    fixed_cost = Column(DOUBLE_PRECISION, nullable=True)
    variable_cost_per_km = Column(DOUBLE_PRECISION, nullable=True)
