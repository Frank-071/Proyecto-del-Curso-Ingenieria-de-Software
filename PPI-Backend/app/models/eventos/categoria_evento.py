from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base


class CategoriaEvento(Base):
    __tablename__ = 'CategoriaEvento'
    
    id = Column('categoria_evento_id', Integer, primary_key=True, autoincrement=True)
    nombre = Column('nombre', String(50), nullable=False)
    descripcion = Column('descripcion', String(200), nullable=False)
    
    # Relación 1:N con Evento (una categoría puede tener muchos eventos)
    eventos = relationship("Evento", back_populates="categoria_evento")

