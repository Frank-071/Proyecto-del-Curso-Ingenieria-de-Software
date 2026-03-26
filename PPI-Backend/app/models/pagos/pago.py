from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class Pago(Base):
    __tablename__ = 'Pagos'
    
    id = Column('pago_id', Integer, primary_key=True, autoincrement=True)
    cliente_id = Column('cliente_id', Integer, ForeignKey('Clientes.cliente_id'), nullable=False, index=True)
    metodo_pago_id = Column('metodo_pago_id', Integer, nullable=False)  # 1=tarjeta, 2=Yape/Plin
    fecha_transaccion = Column('fecha_transaccion', DateTime, nullable=False, default=func.now())
    total = Column('total', Numeric(8, 2), nullable=False)
    total_puntos_otorgados = Column('total_puntos_otorgados', Integer, nullable=False)
    
    # Relaciones
    cliente = relationship("Cliente", foreign_keys=[cliente_id])
    detalles_pago = relationship("DetallePago", back_populates="pago")
    
    def __repr__(self) -> str:
        return f"<Pago id={self.id} cliente_id={self.cliente_id} total={self.total}>"