from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Zona(Base):
    __tablename__ = 'Zonas'
    
    id = Column('zona_id', Integer, primary_key=True, autoincrement=True)
    evento_id = Column(Integer, ForeignKey('Eventos.evento_id'), nullable=False, index=True)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(String(200), nullable=False)
    precio = Column(Numeric(8, 2), nullable=False)
    stock_entradas = Column(Integer, nullable=False)
    entradas_disponible = Column(Integer, nullable=False)
    
    # Relaciones
    # Relación N:1 con Evento (muchas zonas pertenecen a un evento)
    evento = relationship("Evento", back_populates="zonas")
    
    # Relación 1:N con Entrada (una zona tiene muchas entradas)
    entradas = relationship("Entrada", back_populates="zona", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Zona id={self.id} nombre={self.nombre} evento_id={self.evento_id}>"

