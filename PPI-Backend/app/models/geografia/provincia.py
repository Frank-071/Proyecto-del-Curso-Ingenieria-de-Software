from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Provincia(Base):
    __tablename__ = 'Provincias'
    
    id = Column('provincia_id', Integer, primary_key=True, autoincrement=True)
    departamento_id = Column('departamento_id', Integer, ForeignKey('departamentos.departamento_id'), nullable=False)
    nombre = Column('nombre', String(20), nullable=False)
    ubigeo = Column('ubigeo', String(4), nullable=False)
    
    # Relación N:1 con Departamento
    departamento = relationship("Departamento", back_populates="provincias")
    # Relación 1:N con Distrito
    distritos = relationship("Distrito", back_populates="provincia")

