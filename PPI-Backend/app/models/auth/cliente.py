from sqlalchemy import Column, Integer, Boolean, ForeignKey, String
from sqlalchemy.orm import relationship
from app.database.base import Base


class Cliente(Base):
    __tablename__ = "Clientes"

    id = Column('cliente_id', Integer, ForeignKey("Usuarios.usuario_id"), primary_key=True)
    rango_id = Column('rango_id', Integer, ForeignKey("Rangos.rango_id"), nullable=True, index=True)
    imagen_perfil = Column('imagen_perfil', String(500), nullable=True)
    puntos_disponibles = Column('puntos_disponibles', Integer, nullable=True, default=0)
    puntos_historicos = Column('puntos_historicos', Integer, nullable=True, default=0)
    recibir_notificaciones = Column('recibir_notificaciones', Boolean, nullable=True, default=True)

    # Relación 1:1 con Usuario (un cliente es un usuario)
    usuario = relationship("Usuario", back_populates="cliente", uselist=False)
    
    # Relación N:1 con Rango (muchos clientes pueden tener el mismo rango)
    rango = relationship("Rango", foreign_keys=[rango_id])
    
    # Relación 1:N con Entrada (un cliente puede tener muchas entradas)
    entradas = relationship("Entrada", back_populates="cliente")

    def __repr__(self) -> str:
        return f"<Cliente id={self.id} puntos_disponibles={self.puntos_disponibles} puntos_historicos={self.puntos_historicos}>"