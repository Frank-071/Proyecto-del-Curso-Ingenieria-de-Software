from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.models.geografia.distrito import Distrito
from app.repositories.base_repository import BaseRepository


class DistritoRepository(BaseRepository[Distrito]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Distrito, active_field=None)
    
    async def get_by_provincia_id(self, provincia_id: int) -> List[Distrito]:
        stmt = select(Distrito).filter(Distrito.provincia_id == provincia_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

