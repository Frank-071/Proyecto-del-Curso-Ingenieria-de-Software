from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.fidelizacion.rango import Rango
from app.repositories.base_repository import BaseRepository


class RangoRepository(BaseRepository[Rango]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Rango)
    
    async def get_by_nombre(self, nombre: str):
        stmt = select(Rango).filter(Rango.nombre == nombre)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_puntos(self, puntos: int):
        stmt = select(Rango).filter(
            Rango.puntos_min <= puntos,
            Rango.puntos_max >= puntos
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

