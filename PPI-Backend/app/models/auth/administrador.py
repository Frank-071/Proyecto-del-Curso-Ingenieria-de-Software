from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class NivelAccesoEnum(PyEnum):
    ADMINISTRADOR = "Administrador"
    SUPER_ADMINISTRADOR = "Super Administrador"


class Administrador(Base):
    __tablename__ = "Administradores"

    id = Column('administrador_id', Integer, ForeignKey("Usuarios.usuario_id"), primary_key=True)
    nivel_acceso = Column('nivel_acceso', String(20), nullable=False)

    # Relación 1:1 con Usuario (un administrador es un usuario)
    usuario = relationship("Usuario", back_populates="administrador", uselist=False)
    
    # Relación 1:N con Evento (un administrador puede crear muchos eventos)
    eventos = relationship("Evento", back_populates="administrador")

    def __repr__(self) -> str:
        return f"<Administrador id={self.id} nivel_acceso={self.nivel_acceso}>"