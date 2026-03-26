from sqlalchemy import Column, Integer, String, Text, JSON, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base
import enum

class TipoError(str, enum.Enum):
    DATABASE = "DATABASE"
    API = "API"
    VALIDATION = "VALIDATION"
    AUTHENTICATION = "AUTHENTICATION"
    AUTHORIZATION = "AUTHORIZATION"
    SYSTEM = "SYSTEM"

class ModuloSistema(str, enum.Enum):
    EVENTOS = "EVENTOS"
    ZONAS = "ZONAS"
    LOCALES = "LOCALES"
    USUARIOS = "USUARIOS"
    ENTRADAS = "ENTRADAS"
    PAGOS = "PAGOS"
    SISTEMA = "SISTEMA"

class LogError(Base):
    __tablename__ = "LogsErrores"
    
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("Usuarios.usuario_id"), nullable=True)
    tipo_error = Column(Enum(TipoError), nullable=False)
    modulo = Column(Enum(ModuloSistema), nullable=False)
    descripcion_tecnica = Column(Text, nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    detalles_adicionales = Column(JSON, nullable=True)
    
    # Relación con Usuario (puede ser null para errores del sistema)
    usuario = relationship("Usuario", backref="logs_errores")