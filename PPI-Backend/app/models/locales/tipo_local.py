from sqlalchemy import Column, Integer, String
from app.database.base import Base


class TipoLocal(Base):
    __tablename__ = 'TiposLocales'
    
    id = Column('tipo_local_id', Integer, primary_key=True, autoincrement=True)
    nombre = Column('nombre', String(50), nullable=False)
    descripcion = Column('descripcion', String(255), nullable=True)

