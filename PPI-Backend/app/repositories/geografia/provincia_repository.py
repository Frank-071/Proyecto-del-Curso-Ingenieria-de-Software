from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.models.geografia.provincia import Provincia
from app.repositories.base_repository import BaseRepository


class ProvinciaRepository(BaseRepository[Provincia]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Provincia, active_field=None)
    
    async def get_by_departamento_id(self, departamento_id: int) -> List[Provincia]:
        stmt = select(Provincia).filter(Provincia.departamento_id == departamento_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

