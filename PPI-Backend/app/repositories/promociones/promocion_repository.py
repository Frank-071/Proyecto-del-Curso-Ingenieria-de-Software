from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models import Promocion
from app.repositories.base_repository import BaseRepository


class PromocionRepository(BaseRepository[Promocion]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Promocion)

    async def get_by_evento(self, evento_id: int) -> List[Promocion]:
        stmt = select(Promocion).filter(Promocion.evento_id == evento_id, Promocion.activo == True)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_filtered(self, skip: int = 0, limit: int = 50, activo: Optional[bool] = True) -> List[Promocion]:
        stmt = select(Promocion)
        if activo is not None:
            stmt = stmt.filter(Promocion.activo == activo)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
