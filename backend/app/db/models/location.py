from sqlalchemy import Column, Integer, Text, Float
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from app.db.base import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    type = Column(Text, nullable=False)  # depot|port|rail|airport|customer
    lat = Column(DOUBLE_PRECISION, nullable=False)
    lon = Column(DOUBLE_PRECISION, nullable=False)
    # geom is generated in DB by trigger; optional to map:
    # from sqlalchemy import text
    # geom = Column(Geometry('POINT', srid=4326))  # if you later add geoalchemy2
