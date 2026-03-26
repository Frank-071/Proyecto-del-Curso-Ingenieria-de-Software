from typing import List, Optional, Tuple
from sqlalchemy import select, update, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.models.eventos.notificacion import Notificacion
from app.models.eventos.entrada import Entrada
from app.models.eventos.zona import Zona
from app.models.eventos.evento import Evento
from app.models.locales.local import Local
from app.models.auth.cliente import Cliente
from app.models.auth.usuario import Usuario
from datetime import timedelta


class NotificacionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, notificacion: Notificacion) -> Notificacion:
        self.session.add(notificacion)
        await self.session.flush()
        return notificacion

    async def fetch_pending_batch(self, limit: int = 50, now: Optional[datetime] = None) -> List[Notificacion]:
        now = now or datetime.now(timezone.utc).replace(tzinfo=None)
        stmt = (
            select(Notificacion)
            .where(
                Notificacion.status == 0,
                or_(Notificacion.notify_at != None, Notificacion.notify_end != None),
                or_(Notificacion.notify_at <= now, Notificacion.notify_end <= now),
            )
            .options(
                selectinload(Notificacion.cliente).selectinload(Cliente.usuario),  # ¡CARGAR USUARIO PARA OBTENER EMAIL!
                selectinload(Notificacion.entrada).selectinload(Entrada.zona).selectinload(Zona.evento).selectinload(Evento.local),
                selectinload(Notificacion.evento).selectinload(Evento.local),
            )
            .order_by(Notificacion.notify_at)
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def mark_sent(self, notificacion_id: int, processed_at: Optional[datetime] = None):
        processed_at = processed_at or datetime.now(timezone.utc).replace(tzinfo=None)
        stmt = (
            update(Notificacion)
            .where(Notificacion.id == notificacion_id)
            .values(status=1, processed_at=processed_at)
        )
        await self.session.execute(stmt)

    async def increment_attempts(self, notificacion_id: int, last_error: Optional[str] = None):
        stmt = (
            update(Notificacion)
            .where(Notificacion.id == notificacion_id)
            .values(attempts=Notificacion.attempts + 1, last_error=last_error)
        )
        await self.session.execute(stmt)
        await self.session.flush()
        sel = select(Notificacion.attempts, Notificacion.max_attempts).where(Notificacion.id == notificacion_id)
        result = await self.session.execute(sel)
        row = result.first()
        if row:
            return int(row[0] or 0), int(row[1] or 0)
        return 0, 0

    async def update_for_event(self, evento_id: int, fecha_inicio_utc: Optional[datetime] = None, fecha_fin_utc: Optional[datetime] = None) -> int:
        values = {}
        if fecha_inicio_utc is not None:
            values['notify_at'] = fecha_inicio_utc - timedelta(days=2)
        if fecha_fin_utc is not None:
            values['notify_end'] = fecha_fin_utc

        if not values:
            return 0

        stmt = (
            update(Notificacion)
            .where(Notificacion.evento_id == evento_id, Notificacion.status == 0)
            .values(**values)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return getattr(result, 'rowcount', 0)
