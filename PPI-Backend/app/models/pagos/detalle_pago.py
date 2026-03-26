from sqlalchemy import Column, Integer, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database.base import Base


class DetallePago(Base):
    __tablename__ = 'DetallesPagos'
    
    id = Column('pago_detalle_id', Integer, primary_key=True, autoincrement=True)
    pago_id = Column('pago_id', Integer, ForeignKey('Pagos.pago_id'), nullable=False, index=True)
    zona_id = Column('zona_id', Integer, ForeignKey('Zonas.zona_id'), nullable=False, index=True)
    promocion_id = Column('promocion_id', Integer, nullable=True)  # Por ahora vacío
    cantidad = Column('cantidad', Integer, nullable=False)
    subtotal = Column('subtotal', Numeric(8, 2), nullable=False)
    descuento_aplicado = Column('descuento_aplicado', Numeric(8, 2), nullable=False, default=0)
    descuento_rango = Column('descuento_rango', Numeric(8, 2), nullable=False, default=0)
    total_zona = Column('total_zona', Numeric(8, 2), nullable=False)
    igv = Column('igv', Numeric(8, 2), nullable=False)
    
    # Relaciones
    pago = relationship("Pago", back_populates="detalles_pago")
    zona = relationship("Zona", foreign_keys=[zona_id])
    entradas = relationship("Entrada", back_populates="detalle_pago")
    
    def __repr__(self) -> str:
        return f"<DetallePago id={self.id} pago_id={self.pago_id} zona_id={self.zona_id} cantidad={self.cantidad}>"