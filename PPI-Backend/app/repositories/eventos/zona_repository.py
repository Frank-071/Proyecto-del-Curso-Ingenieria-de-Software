from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models import Zona
from app.models.eventos.evento import Evento
from app.repositories.base_repository import BaseRepository


class ZonaRepository(BaseRepository[Zona]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Zona, active_field=None)
    
    async def get_by_id_all(self, id: int) -> Optional[Zona]:
        """Override para cargar relaciones necesarias (eager loading)"""
        stmt = select(Zona).filter(Zona.id == id).options(
            selectinload(Zona.evento).selectinload(Evento.local)  # Cargar evento Y local para evitar lazy loading
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_evento(self, evento_id: int) -> List[Zona]:
        """Obtener zonas de un evento con sus entradas cargadas"""
        stmt = select(Zona).filter(Zona.evento_id == evento_id).options(
            selectinload(Zona.entradas)  # Cargar entradas para validar eliminación
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_zonas_con_disponibilidad(self, evento_id: int) -> List[Zona]:
        stmt = select(Zona).filter(
            Zona.evento_id == evento_id,
            Zona.entradas_disponible > 0
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

