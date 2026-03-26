from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth.administrador import Administrador
from app.repositories.base_repository import BaseRepository

class AdministradorRepository(BaseRepository[Administrador]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Administrador)