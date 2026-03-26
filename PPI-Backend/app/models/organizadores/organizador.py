from sqlalchemy import Column, Integer, String
from app.database.base import Base

class Organizador(Base):
    __tablename__ = "Organizadores"

    id = Column('organizador_id', Integer, primary_key=True)
    nombre = Column(String(50), nullable=True)
    correo = Column(String(100), nullable=True)
    telefono = Column(String(23), nullable=False)

