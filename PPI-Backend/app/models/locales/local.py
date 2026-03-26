from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base


class Local(Base):
    __tablename__ = 'Locales'
    
    id = Column('local_id', Integer, primary_key=True, autoincrement=True)
    distrito_id = Column(Integer, ForeignKey('Distritos.distrito_id'), nullable=False, index=True)
    tipo_local_id = Column(Integer, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(200), nullable=False, unique=True)
    aforo = Column(Integer, nullable=False)
    activo = Column(Boolean, nullable=False)
    latitud = Column(Float, nullable=True, index=True)
    longitud = Column(Float, nullable=True, index=True)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relación N:1 con Distrito
    distrito = relationship("Distrito")
    # Relación N:1 con TipoLocal
    tipo_local = relationship("TipoLocal", foreign_keys=[tipo_local_id], primaryjoin="Local.tipo_local_id == TipoLocal.id")
    # Relación 1:N con Evento (un local puede tener muchos eventos)
    eventos = relationship("Evento", back_populates="local")

