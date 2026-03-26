from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import Optional
from app.models.auth.cliente import Cliente
from app.repositories.base_repository import BaseRepository

class ClienteRepository(BaseRepository[Cliente]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Cliente, active_field=None)
    
    async def get_by_id(self, id: int) -> Cliente:
        """Override para cargar relaciones necesarias (eager loading)"""
        stmt = select(Cliente).filter(Cliente.id == id).options(
            joinedload(Cliente.usuario),
            joinedload(Cliente.rango)
        )
        result = await self.db.execute(stmt)
        obj = result.unique().scalar_one_or_none()
        
        if obj is None:
            raise ValueError(f"Cliente con ID {id} no encontrado")
        return obj
    
    async def get_by_id_all(self, id: int) -> Optional[Cliente]:
        """Override para cargar relaciones necesarias (eager loading)"""
        stmt = select(Cliente).filter(Cliente.id == id).options(
            joinedload(Cliente.usuario),
            joinedload(Cliente.rango)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()