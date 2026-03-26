from sqlalchemy.ext.asyncio import AsyncSession
from app.models.locales.tipo_local import TipoLocal
from app.repositories.base_repository import BaseRepository


class TipoLocalRepository(BaseRepository[TipoLocal]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, TipoLocal, active_field=None)

