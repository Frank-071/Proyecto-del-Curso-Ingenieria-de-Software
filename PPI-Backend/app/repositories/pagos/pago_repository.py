from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.pagos import Pago
from app.repositories.base_repository import BaseRepository


class PagoRepository(BaseRepository[Pago]):
    def __init__(self, db: AsyncSession):
        # Los pagos no tienen campo 'activo', por lo que pasamos None
        super().__init__(db, Pago, active_field=None)

    async def get_by_cliente_id(self, cliente_id: int) -> List[Pago]:
        """Obtiene todos los pagos de un cliente"""
        stmt = select(Pago).where(Pago.cliente_id == cliente_id).order_by(Pago.fecha_transaccion.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_with_detalles(self, pago_id: int) -> Optional[Pago]:
        """Obtiene un pago con todos sus detalles"""
        stmt = (
            select(Pago)
            .options(selectinload(Pago.detalles_pago))
            .where(Pago.id == pago_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_sin_commit(self, obj_data: dict) -> Pago:
        """Crea un pago sin hacer commit (para uso en transacciones más grandes)"""
        db_obj = Pago(**obj_data)
        self.db.add(db_obj)
        await self.db.flush()  # Para obtener el ID generado
        return db_obj