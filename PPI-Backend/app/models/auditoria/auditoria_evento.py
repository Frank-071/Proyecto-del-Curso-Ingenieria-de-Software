from sqlalchemy import Column, Integer, String, Text, JSON, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base
import enum

class TipoEvento(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"

class EntidadAfectada(str, enum.Enum):
    EVENTOS = "EVENTOS"
    LOCALES = "LOCALES"
    ZONAS = "ZONAS"
    USUARIOS = "USUARIOS"
    ENTRADAS = "ENTRADAS"

class AuditoriaEvento(Base):
    __tablename__ = "AuditoriaEventos"
    
    auditoria_id = Column(Integer, primary_key=True, autoincrement=True)
    administrador_id = Column(Integer, ForeignKey("Usuarios.usuario_id"), nullable=False)
    tipo_evento = Column(Enum(TipoEvento), nullable=False)
    entidad_afectada = Column(Enum(EntidadAfectada), nullable=False)
    entidad_id = Column(Integer, nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    estado_anterior = Column(JSON, nullable=True)
    estado_nuevo = Column(JSON, nullable=True)
    
    # Relación con Usuario (administrador)
    administrador = relationship("Usuario", backref="auditorias_realizadas")