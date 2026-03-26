from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.organizadores.organizador import Organizador
from typing import List, Optional
from app.repositories.base_repository import BaseRepository

class OrganizadorRepository(BaseRepository):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Organizador, active_field=None)
    
    async def get_by_distrito_id(self, distrito_id: int) -> List[Organizador]:
        stmt = select(Organizador).filter(Organizador.distrito_id == distrito_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

