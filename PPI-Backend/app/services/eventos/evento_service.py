from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from typing import Any, Dict, List, Optional, Tuple
import logging
from datetime import datetime, timedelta
from fastapi import UploadFile
from app.repositories.eventos import EventoRepository
from app.schemas.eventos import (
    EventoRequest,
    EventoResponse,
    EventoListResponse,
    EventoDetailResponse,
    EventoPublicResponse,
    ZonaListResponse,
    OrganizadorContactoResponse,
)
from app.utils.handlers import ResponseHandler
from app.core.exceptions import BusinessError
from app.core.config import settings
from app.services.shared import CacheService, S3Service
from app.services.eventos.evento_file_service import EventoFileService
from app.services.eventos.email_queue_service import EmailQueueService
from app.services.eventos.entrada_service import EntradaService
from app.repositories.eventos.notificacion_repository import NotificacionRepository
from app.utils.sanitizer import sanitize_text
from datetime import timezone
from app.core.auditoria.decorador_auditoria import auditar_operacion
from app.models.auditoria.auditoria_evento import EntidadAfectada
from app.core.auditoria.decorador_errores import capturar_errores
from app.models.auditoria.log_error import ModuloSistema
from app.models import Entrada, Zona, Cliente, Usuario
from app.utils.email.email_service import send_email
from app.utils.email.templates import evento_actualizado_email_html, evento_cancelacion_html

logger = logging.getLogger(__name__)


class EventoService:
    TRACKED_FIELDS = {
        "nombre": "Nombre del evento",
        "descripcion": "Descripción",
        "fecha_hora_inicio": "Fecha y hora de inicio",
        "fecha_hora_fin": "Fecha y hora de fin",
        "es_nominal": "Tipo de nominación",
        "estado": "Estado del evento"
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.evento_repository = EventoRepository(db)
        self.file_service = EventoFileService(db)
    
    def _validate_evento_data(self, evento_data: EventoRequest) -> None:
        if evento_data.fecha_hora_inicio >= evento_data.fecha_hora_fin:
            raise BusinessError("La fecha de inicio debe ser anterior a la fecha de fin", 400)
    
    def _handle_integrity_error(self, error: IntegrityError) -> None:
        """Parsea errores de integridad de la BD y lanza BusinessError con mensaje claro"""
        error_msg = str(error.orig).lower()
        
        if "duplicate entry" in error_msg and "ux_eventos_local_inicio" in error_msg:
            raise BusinessError(
                "Ya existe un evento programado en este mismo local para la misma fecha",
                409
            )
        elif "local_id" in error_msg or "fk_eventos_locales" in error_msg:
            raise BusinessError("Local no encontrado", 404)
        elif "categoria_evento_id" in error_msg or "fk_eventos_categoria" in error_msg:
            raise BusinessError("Categoría de evento no encontrada", 404)
        elif "administrador_id" in error_msg or "fk_eventos_administrador" in error_msg:
            raise BusinessError("Administrador no encontrado", 404)
        else:
            raise BusinessError("Error de integridad en la base de datos", 500)

    def _ensure_local_not_changed(self, evento_existente, evento_data: EventoRequest) -> None:
        if evento_data.local_id != getattr(evento_existente, "local_id", None):
            raise BusinessError(
                "No está permitido cambiar el local de un evento existente. Crea un nuevo evento para usar otro local.",
                400
            )

    def _extract_tracked_values(self, evento) -> Dict[str, Any]:
        return {field: getattr(evento, field, None) for field in self.TRACKED_FIELDS}

    def _build_change_set(self, antes: Dict[str, Any], despues: Dict[str, Any]) -> List[Dict[str, str]]:
        cambios: List[Dict[str, str]] = []
        for field, label in self.TRACKED_FIELDS.items():
            old_value = antes.get(field)
            new_value = despues.get(field)
            if self._values_equal(field, old_value, new_value):
                continue
            cambios.append({
                "label": label,
                "old": self._format_field_value(field, old_value),
                "new": self._format_field_value(field, new_value)
            })
        return cambios

    def _values_equal(self, field: str, old_value: Any, new_value: Any) -> bool:
        return self._normalize_compare_value(field, old_value) == self._normalize_compare_value(field, new_value)

    def _normalize_compare_value(self, field: str, value: Any) -> Any:
        if isinstance(value, datetime):
            return value.replace(tzinfo=None)
        if isinstance(value, str):
            trimmed = value.strip()
            return trimmed.lower() if field == "estado" else trimmed
        return value

    def _format_field_value(self, field: str, value: Any) -> str:
        if value is None:
            return "Sin información"
        if isinstance(value, datetime):
            return self._format_datetime(value)
        if isinstance(value, bool):
            return "Sí" if value else "No"
        return str(value)

    def _format_datetime(self, value: Optional[datetime]) -> str:
        if not value:
            return "Sin información"
        return value.strftime("%d/%m/%Y %H:%M")

    def _is_cancellation(self, estado: Optional[str]) -> bool:
        if not estado:
            return False
        return estado.strip().lower() == "cancelado"

    def _build_plain_text_email(
        self,
        destinatario: str,
        evento_nombre: str,
        local_nombre: str,
        fecha_inicio: str,
        fecha_fin: str,
        cambios: List[Dict[str, str]],
        evento_url: str
    ) -> str:
        cambios_lines = "\n".join(
            f"- {cambio['label']}: {cambio['old']} -> {cambio['new']}"
            for cambio in cambios
        )
        return (
            f"Hola {destinatario},\n\n"
            f"Actualizamos la información del evento \"{evento_nombre}\".\n"
            f"Lugar: {local_nombre}.\n"
            f"Inicio: {fecha_inicio}.\n"
            f"Fin: {fecha_fin}.\n\n"
            f"Cambios recientes:\n{cambios_lines}\n\n"
            f"Puedes revisar los detalles en {evento_url}.\n\n"
            "Si tienes dudas, contáctanos respondiendo este correo."
        )

    def _build_plain_text_cancellation(
        self,
        destinatario: str,
        evento_nombre: str,
        evento_fecha: str,
        local_nombre: Optional[str]
    ) -> str:
        lines = [
            f"Hola {destinatario},",
            f"Lamentamos informarte que el evento \"{evento_nombre}\" fue cancelado.",
        ]
        if evento_fecha:
            lines.append(f"Fecha programada: {evento_fecha}.")
        if local_nombre:
            lines.append(f"Lugar: {local_nombre}.")
        lines.append(
            "Actualizamos la información general del evento con las instrucciones de reembolso para los clientes."
        )
        lines.append(
            "Ingresa a tu cuenta de PatasPepas o responde este correo si necesitas ayuda con el reembolso."
        )
        return "\n".join(lines)

    async def _get_event_attendees(self, evento_id: int) -> List[Dict[str, str]]:
        stmt = (
            select(Usuario.email, Usuario.nombres, Usuario.apellidos)
            .select_from(Entrada)
            .join(Cliente, Cliente.id == Entrada.cliente_id)
            .join(Usuario, Usuario.id == Cliente.id)
            .join(Zona, Zona.id == Entrada.zona_id)
            .where(
                Zona.evento_id == evento_id,
                Usuario.activo == True,
                or_(
                    Cliente.recibir_notificaciones == True,
                    Cliente.recibir_notificaciones.is_(None)
                )
            )
            .distinct()
        )
        result = await self.db.execute(stmt)
        attendees = []
        for row in result.all():
            attendees.append({
                "email": row.email,
                "nombre": self._build_attendee_name(row.nombres, row.apellidos)
            })
        return attendees

    def _build_attendee_name(self, nombres: Optional[str], apellidos: Optional[str]) -> str:
        nombres = (nombres or "").strip()
        apellidos = (apellidos or "").strip()
        full_name = f"{nombres} {apellidos}".strip()
        return full_name if full_name else "Cliente"

    async def _notify_event_update(self, evento, cambios: List[Dict[str, str]]) -> None:
        asistentes = await self._get_event_attendees(evento.id)
        if not asistentes:
            return

        local_nombre = getattr(evento.local, "nombre", "Sin local") if evento.local else "Sin local"
        local_direccion = getattr(evento.local, "direccion", None) if evento.local else None
        fecha_inicio = self._format_datetime(getattr(evento, "fecha_hora_inicio", None))
        fecha_fin = self._format_datetime(getattr(evento, "fecha_hora_fin", None))
        evento_url = f"{settings.FRONTEND_URL.rstrip('/')}/evento/{evento.id}"
        subject = f"Actualizamos {evento.nombre}"

        for asistente in asistentes:
            try:
                html_body = evento_actualizado_email_html(
                    destinatario=asistente["nombre"],
                    evento_nombre=evento.nombre,
                    local_nombre=local_nombre,
                    local_direccion=local_direccion,
                    fecha_inicio=fecha_inicio,
                    fecha_fin=fecha_fin,
                    cambios=cambios,
                    evento_url=evento_url
                )
                plain_body = self._build_plain_text_email(
                    asistente["nombre"],
                    evento.nombre,
                    local_nombre,
                    fecha_inicio,
                    fecha_fin,
                    cambios,
                    evento_url
                )
                await send_email(
                    to_email=asistente["email"],
                    subject=subject,
                    body=html_body,
                    plain_text_body=plain_body
                )
            except Exception as exc:
                logger.warning(
                    "No se pudo enviar la notificación de actualización del evento %s a %s: %s",
                    evento.id,
                    asistente["email"],
                    exc
                )

    async def _notify_event_cancellation(self, evento) -> None:
        asistentes = await self._get_event_attendees(evento.id)
        if not asistentes:
            return

        evento_nombre = getattr(evento, "nombre", "Evento")
        evento_fecha = self._format_datetime(getattr(evento, "fecha_hora_inicio", None))
        local_nombre = getattr(evento.local, "nombre", None) if getattr(evento, "local", None) else None
        subject = f"{evento_nombre} fue cancelado"
        
        # URLs para el template
        frontend_url = settings.FRONTEND_URL.rstrip("/") if settings.FRONTEND_URL else ""
        tickets_url = f"{frontend_url}/tickets" if frontend_url else ""
        evento_url = f"{frontend_url}/evento/{evento.id}" if frontend_url else ""

        for asistente in asistentes:
            try:
                html_body = evento_cancelacion_html(
                    evento_nombre=evento_nombre,
                    evento_fecha=evento_fecha or "Sin fecha",
                    local_nombre=local_nombre,
                    tickets_url=tickets_url,
                    evento_url=evento_url
                )
                plain_body = self._build_plain_text_cancellation(
                    destinatario=asistente["nombre"],
                    evento_nombre=evento_nombre,
                    evento_fecha=evento_fecha or "",
                    local_nombre=local_nombre
                )
                await send_email(
                    to_email=asistente["email"],
                    subject=subject,
                    body=html_body,
                    plain_text_body=plain_body
                )
            except Exception as exc:
                logger.warning(
                    "No se pudo enviar la notificación de cancelación del evento %s a %s: %s",
                    evento.id,
                    asistente["email"],
                    exc
                )

    async def _update_notification_jobs(self, evento) -> None:
        notif_repo = NotificacionRepository(self.db)
        fecha_inicio_utc = self._to_utc_naive(getattr(evento, 'fecha_hora_inicio', None))
        fecha_fin_utc = self._to_utc_naive(getattr(evento, 'fecha_hora_fin', None))
        try:
            await notif_repo.update_for_event(evento.id, fecha_inicio_utc, fecha_fin_utc)
            await self.db.commit()
        except OperationalError as exc:
            await self.db.rollback()
            logger.warning(
                "No se pudieron reprogramar las notificaciones del evento %s por lock en la tabla: %s",
                evento.id,
                exc
            )
        except SQLAlchemyError as exc:
            await self.db.rollback()
            logger.error(
                "Error SQL al reprogramar las notificaciones del evento %s: %s",
                evento.id,
                exc
            )

    def _to_utc_naive(self, dt: Optional[datetime]) -> Optional[datetime]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc).astimezone(timezone.utc).replace(tzinfo=None)
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    
    async def get_all_eventos(
        self, 
        skip: int = 0, 
        limit: int = 10,
        categoria_id: Optional[int] = None,
        estado: Optional[str] = None,
        periodo: Optional[str] = None,
        busqueda: Optional[str] = None
    ) -> Dict:
        cache_key = self._build_cache_key(skip, limit, categoria_id, estado, periodo, busqueda)
        
        async def fetch():
            fecha_inicio = None
            fecha_fin = None
            if periodo:
                fecha_inicio, fecha_fin = self._calcular_periodo(periodo)
            
            total = await self.evento_repository.count_filtered(
                categoria_id=categoria_id,
                estado=estado,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                busqueda=busqueda
            )
            
            eventos = await self.evento_repository.get_all_filtered(
                skip=skip,
                limit=limit,
                categoria_id=categoria_id,
                estado=estado,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                busqueda=busqueda
            )
            
            eventos_response = []
            for evento in eventos:
                evento_dict = EventoListResponse.model_validate(evento).model_dump()
                evento_dict['local_nombre'] = evento.local.nombre if evento.local else None
                eventos_response.append(evento_dict)
            
            return {
                "success": True,
                "message": "Eventos obtenidos exitosamente",
                "data": eventos_response,
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "total": total,
                    "hasNext": skip + limit < total,
                    "hasPrev": skip > 0,
                    "currentPage": (skip // limit) + 1,
                    "totalPages": (total + limit - 1) // limit
                }
            }
        
        return await CacheService.get_or_fetch(
            cache_key=cache_key,
            tag_key="cache_tags:eventos",
            fetch_fn=fetch,
            ttl=settings.CACHE_TTL_EVENTO_LIST
        )
    
    def _build_cache_key(
        self, 
        skip: int, 
        limit: int, 
        categoria_id: Optional[int], 
        estado: Optional[str], 
        periodo: Optional[str],
        busqueda: Optional[str]
    ) -> str:
        return (
            f"eventos:list:skip={skip}:limit={limit}:"
            f"cat={categoria_id or 'all'}:estado={estado or 'all'}:"
            f"periodo={periodo or 'all'}:busqueda={busqueda or 'all'}"
        )
    
    def _calcular_periodo(self, periodo: str) -> Tuple[datetime, datetime]:
        ahora = datetime.now()
        hoy = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if periodo == "proximos_7_dias":
            inicio = hoy
            fin = hoy + timedelta(days=7, hours=23, minutes=59, seconds=59)
            return (inicio, fin)
        elif periodo == "este_mes":
            inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if ahora.month == 12:
                fin_mes = inicio_mes.replace(year=ahora.year + 1, month=1, day=1) - timedelta(seconds=1)
            else:
                fin_mes = inicio_mes.replace(month=ahora.month + 1, day=1) - timedelta(seconds=1)
            return (inicio_mes, fin_mes)
        elif periodo == "proximo_mes":
            if ahora.month == 12:
                inicio_proximo = ahora.replace(year=ahora.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                inicio_proximo = ahora.replace(month=ahora.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if inicio_proximo.month == 12:
                fin_proximo = inicio_proximo.replace(year=inicio_proximo.year + 1, month=1, day=1) - timedelta(seconds=1)
            else:
                fin_proximo = inicio_proximo.replace(month=inicio_proximo.month + 1, day=1) - timedelta(seconds=1)
            return (inicio_proximo, fin_proximo)
        
        return (None, None)
    
    async def get_eventos_publicos(
        self, 
        skip: int = 0, 
        limit: int = 10,
        categoria_id: Optional[int] = None,
        distrito_id: Optional[int] = None,
        fecha_inicio: Optional[datetime] = None,
        busqueda: Optional[str] = None
    ) -> Dict:
        cache_key = self._build_cache_key_public(skip, limit, categoria_id, distrito_id, fecha_inicio, busqueda)
        
        async def fetch():
            total = await self.evento_repository.count_public_filtered(
                categoria_id=categoria_id,
                distrito_id=distrito_id,
                fecha_inicio=fecha_inicio,
                busqueda=busqueda
            )
            
            eventos = await self.evento_repository.get_all_with_local_public(
                skip=skip,
                limit=limit,
                categoria_id=categoria_id,
                distrito_id=distrito_id,
                fecha_inicio=fecha_inicio,
                busqueda=busqueda
            )
            
            eventos_response = []
            for evento in eventos:
                evento_public = {
                    'id': evento.id,
                    'nombre': evento.nombre,
                    'descripcion': evento.descripcion,
                    'fecha_hora_inicio': evento.fecha_hora_inicio,
                    'fecha_hora_fin': evento.fecha_hora_fin,
                    'es_nominal': evento.es_nominal,
                    'icono': evento.icono,
                    'local_nombre': evento.local.nombre if evento.local else 'Sin local',
                    'local_direccion': evento.local.direccion if evento.local and hasattr(evento.local, 'direccion') else None,
                    'categoria_nombre': evento.categoria_evento.nombre if evento.categoria_evento else 'Sin categoría'
                }
                evento_dict = EventoPublicResponse.model_validate(evento_public).model_dump()
                eventos_response.append(evento_dict)
            
            return {
                "success": True,
                "message": "Eventos públicos obtenidos exitosamente",
                "data": eventos_response,
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "total": total,
                    "hasNext": skip + limit < total,
                    "hasPrev": skip > 0,
                    "currentPage": (skip // limit) + 1,
                    "totalPages": (total + limit - 1) // limit
                }
            }
        
        return await CacheService.get_or_fetch(
            cache_key=cache_key,
            tag_key="cache_tags:eventos",
            fetch_fn=fetch,
            ttl=settings.CACHE_TTL_EVENTO_LIST
        )
    
    def _build_cache_key_public(
        self, 
        skip: int, 
        limit: int, 
        categoria_id: Optional[int], 
        distrito_id: Optional[int], 
        fecha_inicio: Optional[datetime],
        busqueda: Optional[str]
    ) -> str:
        fecha_inicio_str = fecha_inicio.isoformat() if fecha_inicio else 'none'
        return (
            f"eventos:public:skip={skip}:limit={limit}:"
            f"cat={categoria_id or 'all'}:distrito={distrito_id or 'all'}:"
            f"fecha_inicio={fecha_inicio_str}:"
            f"busqueda={busqueda or 'all'}"
        )
    
    async def get_evento_by_id(self, evento_id: int) -> Dict:
        async def fetch():
            evento = await self.evento_repository.get_by_id_with_zonas_all(evento_id)
            if not evento:
                raise BusinessError("Evento no encontrado", 404)
            
            zonas_dict = [ZonaListResponse.model_validate(zona).model_dump() for zona in evento.zonas]
            
            evento_detail = EventoDetailResponse.model_validate(evento, from_attributes=True)
            evento_dict = evento_detail.model_dump(by_alias=True)
            evento_dict['zonas'] = zonas_dict
            
            return ResponseHandler.success_response(evento_dict, "Evento obtenido exitosamente")
        
        return await CacheService.get_or_fetch(
            cache_key=f"evento:detail:{evento_id}",
            tag_key="cache_tags:eventos",
            fetch_fn=fetch,
            ttl=settings.CACHE_TTL_EVENTO_DETAIL
        )

    async def get_evento_organizador_contacto(self, evento_id: int) -> Dict:
        evento = await self.evento_repository.get_by_id_with_organizador(evento_id)
        if not evento:
            raise BusinessError("Evento no encontrado", 404)

        organizador = getattr(evento, "organizador", None)
        if not organizador:
            return ResponseHandler.success_response(None, "Organizador no asignado")

        contacto = OrganizadorContactoResponse.model_validate(organizador).model_dump()
        return ResponseHandler.success_response(contacto, "Organizador obtenido exitosamente")
    
    @auditar_operacion(EntidadAfectada.EVENTOS)
    @capturar_errores(ModuloSistema.EVENTOS)
    async def create_evento(self, evento_data: EventoRequest, administrador_id: int) -> Dict:
        self._validate_evento_data(evento_data)
        
        try:
            evento_dict = evento_data.model_dump()
            evento_creado = await self.evento_repository.create(evento_dict)
            evento_response = EventoResponse.model_validate(evento_creado)
            
            CacheService.safe_invalidate_async(
                CacheService.invalidate_evento_lists(),
                "evento_created"
            )
            
            return ResponseHandler.success_create(evento_response, "Evento creado exitosamente")
        except IntegrityError as e:
            self._handle_integrity_error(e)
    
    @auditar_operacion(EntidadAfectada.EVENTOS)
    @capturar_errores(ModuloSistema.EVENTOS)
    async def update_evento(self, evento_id: int, evento_data: EventoRequest, administrador_id: int) -> Dict:
        self._validate_evento_data(evento_data)
        
        try:
            evento_existente = await self.evento_repository.get_by_id(evento_id)
        except ValueError:
            raise BusinessError("Evento no encontrado", 404)
        if not evento_existente:
            raise BusinessError("Evento no encontrado", 404)

        self._ensure_local_not_changed(evento_existente, evento_data)
        snapshot_antes = self._extract_tracked_values(evento_existente)
        
        try:
            evento_dict = evento_data.model_dump()
            updated_evento = await self.evento_repository.update(evento_id, evento_dict)
            await self._update_notification_jobs(updated_evento)
            snapshot_despues = self._extract_tracked_values(updated_evento)
            cambios = self._build_change_set(snapshot_antes, snapshot_despues)
            evento_response = EventoResponse.model_validate(updated_evento)
            
            await CacheService.invalidate_evento_full(evento_id)
            
            # Retornar información para notificaciones en background (no bloqueante)
            was_cancelled = self._is_cancellation(snapshot_antes.get("estado"))
            is_cancelled_now = self._is_cancellation(snapshot_despues.get("estado"))
            notification_info = None
            if is_cancelled_now and not was_cancelled:
                notification_info = {"type": "cancellation", "evento_id": evento_id}
            elif cambios and not is_cancelled_now:
                notification_info = {"type": "update", "evento_id": evento_id, "cambios": cambios}
            
            response = ResponseHandler.success_update(evento_response, "Evento actualizado exitosamente")
            if notification_info:
                response["notification_info"] = notification_info
            
            return response
        except IntegrityError as e:
            self._handle_integrity_error(e)
    
    @auditar_operacion(EntidadAfectada.EVENTOS)
    @capturar_errores(ModuloSistema.EVENTOS)
    async def delete_evento(self, evento_id: int, administrador_id: int) -> Dict:
        await CacheService.invalidate_evento_full(evento_id)
        
        await self.evento_repository.delete(evento_id)
        
        return ResponseHandler.success_delete("Evento eliminado exitosamente")
    
    async def upload_evento_icono(
        self,
        evento_id: int,
        s3_service: S3Service,
        file: UploadFile
    ) -> Dict:
        return await self.file_service.upload_evento_icono(evento_id, s3_service, file)
    
    async def upload_evento_mapa(
        self,
        evento_id: int,
        s3_service: S3Service,
        file: UploadFile
    ) -> Dict:
        return await self.file_service.upload_evento_mapa(evento_id, s3_service, file)

    @auditar_operacion(EntidadAfectada.EVENTOS)
    @capturar_errores(ModuloSistema.EVENTOS)
    async def update_evento_estado(self, evento_id: int, nuevo_estado: str, administrador_id: int, motivo_cancelacion: Optional[str] = None) -> Dict:
        logger.info(f"Actualizando estado del evento {evento_id} a {nuevo_estado}")
        
        try:
            evento = await self.evento_repository.get_by_id(evento_id)
        except ValueError:
            raise BusinessError("Evento no encontrado", 404)

        try:
            update_data = {"estado": nuevo_estado}
            if nuevo_estado == "Cancelado":
                if not motivo_cancelacion or not motivo_cancelacion.strip():
                    raise BusinessError("Debe registrar el motivo de cancelación", 400)
                update_data["motivo_cancelacion"] = sanitize_text(motivo_cancelacion, max_length=2000)
            else:
                update_data["motivo_cancelacion"] = None

            updated_evento = await self.evento_repository.update(evento_id, update_data)
            
            await CacheService.invalidate_evento_full(evento_id)
            
            if nuevo_estado == "Cancelado":
                try:
                    entrada_service = EntradaService(self.db)
                    cliente_ids = await entrada_service.get_clientes_unicos_evento(evento_id)
                    if cliente_ids:
                        enqueued = await EmailQueueService.enqueue_cancelacion_evento(evento_id, cliente_ids)
                        logger.info(f"Encolados {enqueued} correos de cancelación para evento {evento_id}")
                except Exception as e:
                    logger.error(f"Error encolando correos de cancelación para evento {evento_id}: {e}")
            
            return ResponseHandler.success_response(
                {
                    "estado": nuevo_estado,
                    "motivo_cancelacion": getattr(updated_evento, "motivo_cancelacion", update_data.get("motivo_cancelacion"))
                }, 
                "Estado actualizado exitosamente"
            )
        except BusinessError:
            raise
        except Exception as e:
            logger.error(f"Error actualizando estado del evento {evento_id}: {e}")
            raise BusinessError("Error interno al actualizar estado", 500)
    
    @auditar_operacion(EntidadAfectada.EVENTOS)
    @capturar_errores(ModuloSistema.EVENTOS)
    async def create_evento_with_files(
        self,
        evento_data: EventoRequest,
        s3_service: S3Service,
        administrador_id: int,
        icono: Optional[UploadFile] = None,
        mapa: Optional[UploadFile] = None
    ) -> Dict:
        try:
            return await self.file_service.create_evento_with_files(
                evento_data, 
                s3_service, 
                self._validate_evento_data,
                icono, 
                mapa
            )
        except IntegrityError as e:
            self._handle_integrity_error(e)
    
    @auditar_operacion(EntidadAfectada.EVENTOS)
    @capturar_errores(ModuloSistema.EVENTOS)
    async def update_evento_with_files(
        self,
        evento_id: int,
        evento_data: EventoRequest,
        s3_service: S3Service,
        administrador_id: int,
        icono: Optional[UploadFile] = None,
        mapa: Optional[UploadFile] = None
    ) -> Dict:
        self._validate_evento_data(evento_data)

        try:
            evento_existente = await self.evento_repository.get_by_id(evento_id)
        except ValueError:
            raise BusinessError("Evento no encontrado", 404)
        if not evento_existente:
            raise BusinessError("Evento no encontrado", 404)

        self._ensure_local_not_changed(evento_existente, evento_data)
        snapshot_antes = self._extract_tracked_values(evento_existente)

        try:
            resultado = await self.file_service.update_evento_with_files(
                evento_id,
                evento_data, 
                s3_service, 
                self._validate_evento_data,
                icono, 
                mapa
            )

            updated_evento = await self.evento_repository.get_by_id(evento_id)
            snapshot_despues = self._extract_tracked_values(updated_evento)
            cambios = self._build_change_set(snapshot_antes, snapshot_despues)
            await self._update_notification_jobs(updated_evento)

            # Retornar información para notificaciones en background (no bloqueante)
            was_cancelled = self._is_cancellation(snapshot_antes.get("estado"))
            is_cancelled_now = self._is_cancellation(snapshot_despues.get("estado"))
            notification_info = None
            if is_cancelled_now and not was_cancelled:
                notification_info = {"type": "cancellation", "evento_id": evento_id}
            elif cambios and not is_cancelled_now:
                notification_info = {"type": "update", "evento_id": evento_id, "cambios": cambios}
            
            if notification_info and isinstance(resultado, dict):
                resultado["notification_info"] = notification_info

            return resultado
        except IntegrityError as e:
            self._handle_integrity_error(e)

