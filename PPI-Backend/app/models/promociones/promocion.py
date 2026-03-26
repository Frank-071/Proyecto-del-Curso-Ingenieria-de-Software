from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base


class Promocion(Base):
    __tablename__ = 'Promociones'

    id = Column('promocion_id', Integer, primary_key=True, autoincrement=True)
    evento_id = Column('evento_id',Integer, ForeignKey('Eventos.evento_id'), nullable=True, index=True)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(String(300), nullable=True)
    porcentaje_promocion = Column(Numeric(5, 2), nullable=True, default=0)
    fecha_inicio = Column(DateTime, nullable=True, index=True)
    fecha_fin = Column(DateTime, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, index=True)
    # Relaciones
    evento = relationship("Evento", foreign_keys=[evento_id])

    def __repr__(self) -> str:
        return (
            f"<Promocion id={self.id} nombre={self.nombre} porcentaje={self.porcentaje_promocion} "
            f"activo={self.activo}>")
