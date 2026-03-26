from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
from datetime import datetime


class RegistroPunto(Base):
    __tablename__ = "RegistrosPuntos"

    id = Column('id_registro_puntos', Integer, primary_key=True, autoincrement=True)
    cliente_id = Column('id_cliente', Integer, ForeignKey("Clientes.cliente_id"), nullable=False, index=True)
    pago_id = Column('id_pago', Integer, nullable=True)  # Puede estar vacío según tu requerimiento
    entrada_id = Column('id_entrada', Integer, ForeignKey("Entradas.entrada_id"), nullable=True, index=True)  # Ahora nullable para decrementos por canjeo
    tipo_registro = Column('tipo_registro', String(20), nullable=False)  # 'Aumento' o 'Decremento'
    cantidad_puntos = Column('cantidad_puntos', Integer, nullable=False)
    fecha_registro = Column('fecha_registro', DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    cliente = relationship("Cliente", foreign_keys=[cliente_id])
    entrada = relationship("Entrada", foreign_keys=[entrada_id])

    def __repr__(self) -> str:
        return f"<RegistroPunto id={self.id} cliente_id={self.cliente_id} tipo={self.tipo_registro} puntos={self.cantidad_puntos}>"