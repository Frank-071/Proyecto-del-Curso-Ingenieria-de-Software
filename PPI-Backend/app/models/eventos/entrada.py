from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base


class EstadoNominacionEnum(PyEnum):
    PENDIENTE = "Pendiente"
    VALIDA = "Valida"
    INVALIDA = "Invalida"


class EstadoEntradaEnum(PyEnum):
    DISPONIBLE = "Disponible"
    RESERVADA = "Reservada"
    PAGADA = "Pagada"


class Entrada(Base):
    __tablename__ = 'Entradas'
    
    id = Column('entrada_id', Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(Integer, ForeignKey('Clientes.cliente_id'), nullable=False, index=True)
    pago_detalle_id = Column(Integer, ForeignKey('DetallesPagos.pago_detalle_id'), nullable=True, index=True)
    zona_id = Column(Integer, ForeignKey('Zonas.zona_id'), nullable=False, index=True)
    codigo_qr = Column(String(255), nullable=True)
    escaneada = Column(Boolean, nullable=False, default=False)
    fecha_escaneo = Column(DateTime, nullable=True)
    fecha_creacion = Column(DateTime, default=func.now())

    fue_transferida = Column(Boolean, nullable=False, default=False)
    
    estado_nominacion = Column(String(20), nullable=False)
    numero_documento_nominado = Column(String(12), nullable=True)
    
    nombres_nominado = Column(String(60), nullable=True)
    apellidos_nominado = Column(String(60), nullable=True)
    puntos_generados = Column(Integer, nullable=False)
    #asiento = Column(String(10), nullable=True)
    #estado = Column(String(20), nullable=False)
    
    # Relaciones
    # Relación N:1 con Cliente (muchas entradas pueden pertenecer a un cliente)
    cliente = relationship("Cliente", back_populates="entradas")
    
    # Relación N:1 con Zona (muchas entradas pertenecen a una zona)
    zona = relationship("Zona", back_populates="entradas")

    # Relación N:1 con DetallePago (una entrada pertenece a un detalle de pago)
    detalle_pago = relationship("DetallePago", back_populates="entradas")
    
    def __repr__(self) -> str:
        return f"<Entrada id={self.id} cliente_id={self.cliente_id} zona_id={self.zona_id}>"

