from sqlalchemy.ext.asyncio import AsyncSession
from app.models.geografia.departamento import Departamento
from app.repositories.base_repository import BaseRepository


class DepartamentoRepository(BaseRepository[Departamento]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Departamento, active_field=None)

