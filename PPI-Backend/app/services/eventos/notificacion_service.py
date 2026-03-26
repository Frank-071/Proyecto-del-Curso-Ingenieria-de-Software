from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.eventos.notificacion import Notificacion
from app.repositories.eventos.notificacion_repository import NotificacionRepository
from app.utils.email.email_service import send_email
from app.utils.email import templates as email_templates


class NotificacionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = NotificacionRepository(session)

    async def schedule_for_entrada(self, entrada, cliente_id: int, zona=None):
        def to_utc_naive(dt):
            if dt is None:
                return None
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc).astimezone(timezone.utc).replace(tzinfo=None)
            return dt.astimezone(timezone.utc).replace(tzinfo=None)

        evento = None
        if zona is not None:
            evento = getattr(zona, 'evento', None)
        else:
            z = getattr(entrada, 'zona', None)
            if z is not None:
                evento = getattr(z, 'evento', None)

        evento_id = getattr(evento, 'id', None) if evento else None
        fecha_inicio = getattr(evento, 'fecha_hora_inicio', None) if evento else None
        fecha_fin = getattr(evento, 'fecha_hora_fin', None) if evento else None

        fecha_inicio_utc = to_utc_naive(fecha_inicio)
        fecha_fin_utc = to_utc_naive(fecha_fin)

        notify_at = None
        if fecha_inicio_utc is not None:
            notify_at = (fecha_inicio_utc - timedelta(days=2))

        notify_end = fecha_fin_utc

        n = Notificacion(
            entrada_id=getattr(entrada, 'id', None),
            cliente_id=cliente_id,
            zona_id=getattr(zona, 'id', None) if zona else getattr(entrada, 'zona_id', None),
            evento_id=evento_id,
            notify_at=notify_at,
            notify_end=notify_end,
        )

        await self.repo.create(n)
        return n

    async def process_notification(self, notificacion: Notificacion):
        cliente = notificacion.cliente
        entrada = notificacion.entrada
        evento = notificacion.evento or (getattr(entrada, 'zona', None) and getattr(getattr(entrada, 'zona', None), 'evento', None))

        # Obtener email del usuario del cliente
        email = None
        if cliente and hasattr(cliente, 'usuario') and cliente.usuario:
            email = getattr(cliente.usuario, 'email', None)
        
        if not email:
            raise ValueError(f"Cliente {getattr(cliente, 'id', 'unknown')} no tiene email configurado")

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        is_end = False
        if getattr(notificacion, 'notify_end', None) and notificacion.notify_end <= now:
            is_end = True

        if is_end:
            subject = f"Gracias por asistir a {getattr(evento, 'nombre', '')}"
            event_dt = getattr(evento, 'fecha_hora_fin', '')
            fecha_formateada = event_dt.strftime('%d/%m/%Y %H:%M') if hasattr(event_dt, 'strftime') else str(event_dt)
            local_name = getattr(getattr(evento, 'local', None), 'nombre', None)
            body = email_templates.evento_agradecimiento_html(getattr(evento, 'nombre', ''), fecha_formateada, local_name)
        else:
            subject = f"Recordatorio: Tu evento {getattr(evento, 'nombre', '')} inicia pronto"
            event_dt = getattr(evento, 'fecha_hora_inicio', '')
            fecha_formateada = event_dt.strftime('%d/%m/%Y %H:%M') if hasattr(event_dt, 'strftime') else str(event_dt)
            zona_nombre = getattr(getattr(entrada, 'zona', None), 'nombre', None)
            local_name = getattr(getattr(evento, 'local', None), 'nombre', None)
            body = email_templates.evento_recordatorio_html(getattr(evento, 'nombre', ''), fecha_formateada, local_name, zona_nombre)

        await send_email(to_email=email, subject=subject, body=body)

        await self.repo.mark_sent(notificacion.id, processed_at=datetime.now(timezone.utc).replace(tzinfo=None))
