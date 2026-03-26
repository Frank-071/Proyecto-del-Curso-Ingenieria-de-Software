from sqlalchemy.ext.asyncio import AsyncSession
from app.models.eventos.categoria_evento import CategoriaEvento
from app.repositories.base_repository import BaseRepository


class CategoriaEventoRepository(BaseRepository[CategoriaEvento]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CategoriaEvento, active_field=None)

