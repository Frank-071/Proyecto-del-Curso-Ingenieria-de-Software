from fastapi import APIRouter, Depends, Path, Query, UploadFile, File, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.database.connection import get_db, AsyncSessionLocal
from app.schemas.eventos import EventoRequest
from app.services.eventos import EventoService, EntradaService
from app.services.shared import S3Service
from app.core.auth.dependencies import get_current_admin_user, get_current_user
from app.core.rate_limiting import SimpleRateLimiter, get_client_identifier
from app.core.auditoria.decorador_router_errores import capturar_errores_router
from app.models.auditoria.log_error import ModuloSistema
from app.utils.form_body import as_form

router = APIRouter(
    prefix="/eventos",
    tags=["eventos"]
)


class EstadoUpdateRequest(BaseModel):
    estado: str
    motivo_cancelacion: str | None = Field(default=None, max_length=2000)


def get_evento_service(db: AsyncSession = Depends(get_db)) -> EventoService:
    return EventoService(db)

def get_entrada_service(db: AsyncSession = Depends(get_db)) -> EntradaService:
    return EntradaService(db)

def get_s3_service() -> S3Service:
    return S3Service()

eventos_publicos_limiter = SimpleRateLimiter(
    max_requests=1000,
    window_seconds=3600,
    key_prefix="rate_limit:eventos_publicos:ip"
)

@router.get("/publicos")
async def list_eventos_publicos_endpoint(
    request: Request,
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(12, ge=1, le=5000, description="Número de registros a retornar"),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría de evento"),
    distrito_id: Optional[int] = Query(None, description="Filtrar por distrito (del local del evento)"),
    fecha_inicio: Optional[str] = Query(None, description="Filtrar eventos desde esta fecha (formato ISO: YYYY-MM-DD)"),
    busqueda: Optional[str] = Query(None, min_length=2, description="Buscar por nombre o descripción (mínimo 2 caracteres)"),
    evento_service: EventoService = Depends(get_evento_service)
) -> Dict:
    client_ip = get_client_identifier(request)
    await eventos_publicos_limiter.check_rate_limit(
        client_ip,
        custom_error_message="Límite de consultas excedido. Intenta de nuevo en 1 hora."
    )
    
    # Parsear fecha si se proporciona
    fecha_inicio_dt = None
    
    if fecha_inicio:
        try:
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha_inicio inválido. Use YYYY-MM-DD")
    
    return await evento_service.get_eventos_publicos(
        skip=skip,
        limit=limit,
        categoria_id=categoria_id,
        distrito_id=distrito_id,
        fecha_inicio=fecha_inicio_dt,
        busqueda=busqueda
    )


@router.get("/listar")
async def list_eventos_endpoint(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(10, ge=1, le=5000, description="Número de registros a retornar"),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría de evento"),
    estado: Optional[str] = Query(None, description="Filtrar por estado: Borrador, Proximamente, Publicado, Finalizado, Cancelado"),
    periodo: Optional[str] = Query(None, description="Filtrar por período: proximos_7_dias, este_mes, proximo_mes"),
    busqueda: Optional[str] = Query(None, min_length=2, description="Buscar por nombre o descripción (mínimo 2 caracteres)"),
    evento_service: EventoService = Depends(get_evento_service)
) -> Dict:
    return await evento_service.get_all_eventos(skip, limit, categoria_id, estado, periodo, busqueda)

@router.get("/publicos/{evento_id}")
async def get_evento_publico_endpoint(
    request: Request,
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    evento_service: EventoService = Depends(get_evento_service)
) -> Dict:
    client_ip = get_client_identifier(request)
    await eventos_publicos_limiter.check_rate_limit(
        client_ip,
        custom_error_message="Límite de consultas excedido. Intenta de nuevo en 1 hora."
    )
    
    return await evento_service.get_evento_by_id(evento_id)


@router.get("/{evento_id}/organizador-contacto")
async def get_evento_organizador_contacto_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    evento_service: EventoService = Depends(get_evento_service),
    current_user = Depends(get_current_user)
) -> Dict:
    return await evento_service.get_evento_organizador_contacto(evento_id)


@router.get("/{evento_id}")
async def get_evento_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    evento_service: EventoService = Depends(get_evento_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await evento_service.get_evento_by_id(evento_id)


@router.post("/")
@capturar_errores_router(ModuloSistema.EVENTOS)
async def create_evento_endpoint(
    evento_data: EventoRequest = Depends(as_form(EventoRequest)),
    icono: Optional[UploadFile] = File(None),
    mapa: Optional[UploadFile] = File(None),
    evento_service: EventoService = Depends(get_evento_service),
    s3_service: S3Service = Depends(get_s3_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await evento_service.create_evento_with_files(evento_data, s3_service, current_admin.id, icono, mapa)


@router.put("/{evento_id}")
@capturar_errores_router(ModuloSistema.EVENTOS)
async def update_evento_endpoint(
    evento_data: EventoRequest,
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    evento_service: EventoService = Depends(get_evento_service),
    current_admin = Depends(get_current_admin_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> Dict:
    result = await evento_service.update_evento(evento_id, evento_data, administrador_id=current_admin.id)
    
    # Ejecutar notificaciones en background si es necesario
    notification_info = result.get("notification_info") if isinstance(result, dict) else None
    if notification_info:
        async def notify_background():
            async with AsyncSessionLocal() as session:
                service = EventoService(session)
                evento = await service.evento_repository.get_by_id(evento_id)
                if evento:
                    if notification_info["type"] == "cancellation":
                        await service._notify_event_cancellation(evento)
                    elif notification_info["type"] == "update":
                        cambios = notification_info.get("cambios", [])
                        await service._notify_event_update(evento, cambios)
        
        background_tasks.add_task(notify_background)
        
        # Remover notification_info de la respuesta
        if isinstance(result, dict):
            result.pop("notification_info", None)
    
    return result


@router.put("/{evento_id}/form")
@capturar_errores_router(ModuloSistema.EVENTOS)
async def update_evento_form_endpoint(
    evento_data: EventoRequest = Depends(as_form(EventoRequest)),
    icono: Optional[UploadFile] = File(None),
    mapa: Optional[UploadFile] = File(None),
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    evento_service: EventoService = Depends(get_evento_service),
    s3_service: S3Service = Depends(get_s3_service),
    current_admin = Depends(get_current_admin_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> Dict:
    result = await evento_service.update_evento_with_files(evento_id, evento_data, s3_service, current_admin.id, icono, mapa)
    
    # Ejecutar notificaciones en background si es necesario
    notification_info = result.get("notification_info") if isinstance(result, dict) else None
    if notification_info:
        async def notify_background():
            async with AsyncSessionLocal() as session:
                service = EventoService(session)
                evento = await service.evento_repository.get_by_id(evento_id)
                if evento:
                    if notification_info["type"] == "cancellation":
                        await service._notify_event_cancellation(evento)
                    elif notification_info["type"] == "update":
                        cambios = notification_info.get("cambios", [])
                        await service._notify_event_update(evento, cambios)
        
        background_tasks.add_task(notify_background)
        
        # Remover notification_info de la respuesta
        if isinstance(result, dict):
            result.pop("notification_info", None)
    
    return result


@router.delete("/{evento_id}")
@capturar_errores_router(ModuloSistema.EVENTOS)
async def delete_evento_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    evento_service: EventoService = Depends(get_evento_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await evento_service.delete_evento(evento_id, current_admin.id)


@router.post("/{evento_id}/upload-icono")
async def upload_icono_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    file: UploadFile = File(...),
    s3_service: S3Service = Depends(get_s3_service),
    evento_service: EventoService = Depends(get_evento_service)
) -> Dict:
    return await evento_service.upload_evento_icono(evento_id, s3_service, file)


@router.post("/{evento_id}/upload-mapa")
async def upload_mapa_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    file: UploadFile = File(...),
    s3_service: S3Service = Depends(get_s3_service),
    evento_service: EventoService = Depends(get_evento_service)
) -> Dict:
    return await evento_service.upload_evento_mapa(evento_id, s3_service, file)


@router.patch("/{evento_id}/estado")
async def update_evento_estado_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    estado_request: EstadoUpdateRequest = ...,
    evento_service: EventoService = Depends(get_evento_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    """
    Actualiza el estado de un evento
    """
    try:
        return await evento_service.update_evento_estado(
            evento_id,
            estado_request.estado,
            current_admin.id,
            estado_request.motivo_cancelacion
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar estado: {str(e)}")


@router.get("/{evento_id}/tiene-entradas-vendidas")
async def has_entradas_vendidas_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    entrada_service: EntradaService = Depends(get_entrada_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await entrada_service.has_entradas_vendidas_evento(evento_id)
