from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base


class Departamento(Base):
    __tablename__ = 'departamentos'
    
    id = Column('departamento_id', Integer, primary_key=True, autoincrement=True)
    nombre = Column('nombre', String(20), nullable=False)
    ubigeo = Column('ubigeo', String(2), nullable=False)
    
    # Relación 1:N con Provincia
    provincias = relationship("Provincia", back_populates="departamento")

