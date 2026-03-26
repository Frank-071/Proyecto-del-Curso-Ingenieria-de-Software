from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.pagos import DetallePago
from app.repositories.base_repository import BaseRepository


class DetallePagoRepository(BaseRepository[DetallePago]):
    def __init__(self, db: AsyncSession):
        # Los detalles de pago no tienen campo 'activo', por lo que pasamos None
        super().__init__(db, DetallePago, active_field=None)

    async def get_by_pago_id(self, pago_id: int) -> List[DetallePago]:
        """Obtiene todos los detalles de un pago específico"""
        stmt = select(DetallePago).where(DetallePago.pago_id == pago_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_zona_id(self, zona_id: int) -> List[DetallePago]:
        """Obtiene todos los detalles de pago de una zona específica"""
        stmt = select(DetallePago).where(DetallePago.zona_id == zona_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_sin_commit(self, obj_data: dict) -> DetallePago:
        """Crea un detalle de pago sin hacer commit (para uso en transacciones más grandes)"""
        db_obj = DetallePago(**obj_data)
        self.db.add(db_obj)
        await self.db.flush()  # Para obtener el ID generado
        return db_obj

    async def create_bulk_sin_commit(self, detalles_data: List[dict]) -> List[DetallePago]:
        """Crea múltiples detalles de pago sin hacer commit"""
        db_objects = []
        for detalle_data in detalles_data:
            db_obj = DetallePago(**detalle_data)
            self.db.add(db_obj)
            db_objects.append(db_obj)
        
        await self.db.flush()  # Para obtener los IDs generados
        return db_objects