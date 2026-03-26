from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base


class EstadoEventoEnum(PyEnum):
    BORRADOR = "Borrador"
    PROXIMAMENTE = "Proximamente"
    PUBLICADO = "Publicado"
    FINALIZADO = "Finalizado"
    CANCELADO = "Cancelado"


class Evento(Base):
    __tablename__ = 'Eventos'
    
    id = Column('evento_id', Integer, primary_key=True, autoincrement=True)
    local_id = Column(Integer, ForeignKey('Locales.local_id'), nullable=False, index=True)
    organizador_id = Column(Integer, ForeignKey('Organizadores.organizador_id'), nullable=False, index=True)
    categoria_evento_id = Column(Integer, ForeignKey('CategoriaEvento.categoria_evento_id'), nullable=False, index=True)
    administrador_id = Column(Integer, ForeignKey('Administradores.administrador_id'), nullable=False)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(String(400), nullable=False)
    fecha_hora_inicio = Column(DateTime, nullable=False, index=True)
    fecha_hora_fin = Column(DateTime, nullable=False)
    es_nominal = Column(Boolean, nullable=False)
    estado = Column(String(20), nullable=False, index=True)
    motivo_cancelacion = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, index=True)
    fecha_creacion = Column(DateTime, default=func.now())
    icono = Column(String(500), nullable=True)
    banner = Column(String(500), nullable=True)
    mapa = Column(String(500), nullable=True)
    
    # Relaciones
    # Relación N:1 con Local (muchos eventos pueden estar en un local)
    local = relationship("Local", back_populates="eventos")
    
    # Relación N:1 con Organizador
    organizador = relationship("Organizador")
    
    # Relación N:1 con CategoriaEvento (muchos eventos pueden tener la misma categoría)
    categoria_evento = relationship("CategoriaEvento", back_populates="eventos")
    
    # Relación N:1 con Administrador (muchos eventos pueden ser creados por un administrador)
    administrador = relationship("Administrador", back_populates="eventos")
    
    # Relación 1:N con Zona (un evento tiene muchas zonas)
    zonas = relationship("Zona", back_populates="evento", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Evento id={self.id} nombre={self.nombre} estado={self.estado}>"

