from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Distrito(Base):
    __tablename__ = 'Distritos'
    
    id = Column('distrito_id', Integer, primary_key=True, autoincrement=True)
    provincia_id = Column('provincia_id', Integer, ForeignKey('Provincias.provincia_id'), nullable=False)
    nombre = Column(String(20), nullable=False)
    
    # Relación N:1 con Provincia
    provincia = relationship("Provincia", back_populates="distritos")

