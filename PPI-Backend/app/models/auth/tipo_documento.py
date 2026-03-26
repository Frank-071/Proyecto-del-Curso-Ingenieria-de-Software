from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base


class TipoDocumento(Base):
    __tablename__ = 'TiposDocumentos'
    
    id = Column('tipo_documento_id', Integer, primary_key=True, autoincrement=True)
    nombre = Column('nombre', String(50), nullable=False)
    
    # Relación 1:N con Usuario (un tipo de documento puede tener muchos usuarios)
    usuarios = relationship("Usuario", back_populates="tipo_documento")

