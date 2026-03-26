from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models import Entrada, Zona, DetallePago, Pago
from app.repositories.base_repository import BaseRepository
from sqlalchemy import exists


class EntradaRepository(BaseRepository[Entrada]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Entrada, active_field=None)
    
    async def get_by_id_all(self, id: int) -> Optional[Entrada]:
        """Override para cargar relaciones necesarias (eager loading)"""
        stmt = select(Entrada).filter(Entrada.id == id).options(
            selectinload(Entrada.cliente),
            selectinload(Entrada.zona)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_cliente(self, cliente_id: int) -> List[Entrada]:
        stmt = (
            select(
                Entrada,
                DetallePago.total_zona,
                Pago.fecha_transaccion
            )
            .outerjoin(DetallePago, Entrada.pago_detalle_id == DetallePago.id)
            .outerjoin(Pago, DetallePago.pago_id == Pago.id)
            .filter(Entrada.cliente_id == cliente_id)
            .options(
                selectinload(Entrada.zona).selectinload(Zona.evento),
            )
        )

        result = await self.db.execute(stmt)
        entradas = []

        for entrada, total_zona, fecha_transaccion in result.all():
            setattr(entrada, "total_zona", total_zona)
            setattr(entrada, "fecha_transaccion", fecha_transaccion)
            entradas.append(entrada)

        return entradas
    
    async def get_by_zona(self, zona_id: int) -> List[Entrada]:
        stmt = select(Entrada).filter(Entrada.zona_id == zona_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_estado(self, cliente_id: int, estado: str) -> List[Entrada]:
        stmt = select(Entrada).filter(
            Entrada.cliente_id == cliente_id,
            Entrada.estado == estado
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_codigo_qr(self, codigo_qr: str) -> Optional[Entrada]:
        stmt = select(Entrada).filter(Entrada.codigo_qr == codigo_qr)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_entradas_evento(self, evento_id: int) -> List[Entrada]:
        from app.models import Zona
        stmt = select(Entrada).join(Zona).filter(Zona.evento_id == evento_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def count_by_cliente_evento(self, cliente_id: int, evento_id: int) -> int:
        from sqlalchemy import func
        stmt = (
            select(func.count(Entrada.id))
            .join(Zona, Entrada.zona_id == Zona.id)
            .filter(Entrada.cliente_id == cliente_id, Zona.evento_id == evento_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0
    
    async def has_entradas_vendidas_evento(self, evento_id: int) -> bool:
        stmt = select(
            exists(
                select(1).where(
                    Entrada.zona_id == Zona.id,
                    Zona.evento_id == evento_id
                )
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or False
    
    async def get_clientes_unicos_evento(self, evento_id: int) -> List[int]:
        from sqlalchemy import distinct
        stmt = (
            select(distinct(Entrada.cliente_id))
            .join(Zona, Entrada.zona_id == Zona.id)
            .filter(Zona.evento_id == evento_id)
            .filter(Entrada.cliente_id.isnot(None))
        )
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all() if row[0] is not None]

