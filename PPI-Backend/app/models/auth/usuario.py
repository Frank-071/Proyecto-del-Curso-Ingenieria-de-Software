from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base 

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



class Usuario(Base):
    __tablename__ = "Usuarios"  

    id = Column('usuario_id', Integer, primary_key=True, autoincrement=True)
    tipo_documento_id = Column(Integer, ForeignKey('TiposDocumentos.tipo_documento_id'), nullable=False)
    nombres = Column(String(60), nullable=True)
    apellidos = Column(String(60), nullable=True)
    numero_documento = Column(String(12), nullable=False, unique=True, index=True)
    genero = Column(String(50), nullable=True)
    email = Column(String(120), nullable=False, unique=True, index=True)
    contrasena = Column(String(255), nullable=False)
    telefono = Column(String(23), nullable=True)
    fecha_creacion = Column(DateTime, nullable=False, default=func.now())
    creado_por = Column(String(50), nullable=True)
    fecha_modificacion = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())
    modificado_por = Column(String(50), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)

    cliente = relationship("Cliente", back_populates="usuario", uselist=False)
    administrador = relationship("Administrador", back_populates="usuario", uselist=False)
    tipo_documento = relationship("TipoDocumento", back_populates="usuarios", uselist=False)

    def set_password(self, password: str) -> None:
        truncated_password = password[:72]  
        self.contrasena = pwd_context.hash(truncated_password)

    def verify_password(self, plain_password: str) -> bool:
        if not self.contrasena:
            return False
        truncated_password = plain_password[:72] if plain_password else plain_password
        return pwd_context.verify(truncated_password, self.contrasena)

    @property
    def full_name(self) -> str:
        return f"{self.nombres} {self.apellidos}"

    def __repr__(self) -> str:
        return f"<Usuario id={self.id} email={self.email}>"
