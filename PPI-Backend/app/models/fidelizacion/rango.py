from sqlalchemy import Column, Integer, String, Numeric
from app.database.base import Base


class Rango(Base):
    __tablename__ = "Rangos"

    id = Column('rango_id', Integer, primary_key=True, autoincrement=True)
    nombre = Column('nombre', String(50), nullable=False)
    descripcion = Column('descripcion', String(200), nullable=True)
    puntos_min = Column('puntos_min', Integer, nullable=False)
    puntos_max = Column('puntos_max', Integer, nullable=False)
    porcentaje_descuento = Column('porcentaje_descuento', Numeric(5, 2), nullable=False)

    def __repr__(self) -> str:
        return f"<Rango id={self.id} nombre={self.nombre} descuento={self.porcentaje_descuento}%>"


