from sqlalchemy import Column, BigInteger, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP, DOUBLE_PRECISION
from app.db.base import Base

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(BigInteger, primary_key=True)
    vehicle_id = Column(Text, nullable=False)
    ts = Column(TIMESTAMP(timezone=True), nullable=False)
    lat = Column(DOUBLE_PRECISION, nullable=False)
    lon = Column(DOUBLE_PRECISION, nullable=False)
    # geom is set by DB trigger; omit or add later via geoalchemy2
    speed_kph = Column(DOUBLE_PRECISION, nullable=True)
