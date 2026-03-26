from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional
from datetime import datetime
from app.database.connection import get_db
from app.services.auditoria.auditoria_service import AuditoriaService
from app.core.auth.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/auditoria",
    tags=["auditoria"]
)


def get_auditoria_service(db: AsyncSession = Depends(get_db)) -> AuditoriaService:
    """Dependency para obtener el servicio de auditoría"""
    return AuditoriaService(db)


@router.get(
    "/dashboard",
    summary="Obtener dashboard completo",
    description="Obtiene todos los datos del dashboard de auditoría incluyendo KPIs, tendencias, rankings y distribución"
)
async def get_dashboard(
    evento_id: Optional[int] = Query(None, description="ID del evento específico", ge=1),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha de inicio del rango (YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS)"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha de fin del rango (YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS)"),
    current_user = Depends(get_current_admin_user),
    auditoria_service: AuditoriaService = Depends(get_auditoria_service)
) -> Dict:
    """
    Obtiene todos los datos del dashboard de auditoría
    
    **Parámetros:**
    - `evento_id`: (Opcional) Filtrar por evento específico
    - `fecha_desde`: (Opcional) Fecha de inicio. Por defecto: 1 año atrás
    - `fecha_hasta`: (Opcional) Fecha de fin. Por defecto: hoy
    
    **Retorna:**
    - KPIs principales
    - Datos mensuales para gráficos de tendencia
    - Top 5 eventos por ventas
    - Top 5 usuarios por compras
    - Top 5 locales por ingresos
    - Distribución de ventas por evento
    """
    return await auditoria_service.get_all_dashboard(evento_id, fecha_desde, fecha_hasta)


@router.get(
    "/kpis",
    summary="Obtener KPIs principales",
    description="Obtiene los indicadores clave de rendimiento del dashboard"
)
async def get_kpis(
    evento_id: Optional[int] = Query(None, description="ID del evento específico", ge=1),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    current_user = Depends(get_current_admin_user),
    auditoria_service: AuditoriaService = Depends(get_auditoria_service)
) -> Dict:
    """
    Obtiene solo los KPIs principales
    
    **KPIs retornados:**
    - Ventas totales
    - Ventas estimadas (precio de lista)
    - Tickets emitidos
    - Tickets transferidos
    - Incidencias
    - Tasa de conversión
    """
    return await auditoria_service.get_kpis(evento_id, fecha_desde, fecha_hasta)


@router.get(
    "/tendencias",
    summary="Obtener tendencias mensuales",
    description="Obtiene datos agregados por mes para gráficos de tendencia"
)
async def get_tendencias(
    evento_id: Optional[int] = Query(None, description="ID del evento específico", ge=1),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    current_user = Depends(get_current_admin_user),
    auditoria_service: AuditoriaService = Depends(get_auditoria_service)
) -> Dict:
    """
    Obtiene datos mensuales para gráficos de tendencia
    
    **Datos por mes:**
    - Ventas
    - Ventas estimadas
    - Tickets emitidos
    - Incidencias
    """
    return await auditoria_service.get_tendencias(evento_id, fecha_desde, fecha_hasta)


@router.get(
    "/rankings",
    summary="Obtener rankings",
    description="Obtiene los top eventos, usuarios y locales"
)
async def get_rankings(
    fecha_desde: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    limite: int = Query(10, description="Límite de resultados", ge=1, le=100),
    current_user = Depends(get_current_admin_user),
    auditoria_service: AuditoriaService = Depends(get_auditoria_service)
) -> Dict:
    """
    Obtiene los rankings (top N)
    
    **Rankings retornados:**
    - Top eventos por ventas
    - Top usuarios por compras
    - Top locales por ingresos
    """
    return await auditoria_service.get_rankings(fecha_desde, fecha_hasta, limite)


@router.get(
    "/detalle",
    summary="Obtener detalle de transacciones",
    description="Obtiene el detalle completo de todas las transacciones"
)
async def get_detalle_transacciones(
    evento_id: Optional[int] = Query(None, description="ID del evento específico", ge=1),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    current_user = Depends(get_current_admin_user),
    auditoria_service: AuditoriaService = Depends(get_auditoria_service)
) -> Dict:
    """
    Obtiene el detalle de transacciones
    
    **Información por transacción:**
    - ID de pago
    - Cliente
    - Evento
    - Fecha y hora
    - Total
    - Método de pago
    - Cantidad de tickets
    """
    return await auditoria_service.get_detalle_transacciones(evento_id, fecha_desde, fecha_hasta)


@router.get(
    "/health",
    summary="Health check",
    description="Verifica el estado del servicio de auditoría"
)
async def health_check() -> Dict:
    """
    Health check del servicio de auditoría
    """
    return {
        "success": True,
        "message": "Servicio de auditoría funcionando correctamente",
        "data": {"status": "healthy"}
    }


@router.get(
    "/exportar",
    summary="Obtener datos completos para exportación",
    description="Obtiene TODOS los datos sin límites para exportar a Excel"
)
async def get_datos_exportacion(
    evento_id: Optional[int] = Query(None, description="ID del evento específico", ge=1),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    current_user = Depends(get_current_admin_user),
    auditoria_service: AuditoriaService = Depends(get_auditoria_service)
) -> Dict:
    """
    Obtiene todos los datos para exportación a Excel
    
    **Datos retornados (sin límites):**
    - KPIs principales
    - Datos mensuales completos
    - TODOS los eventos con ventas
    - TODOS los usuarios con compras
    - TODOS los locales con ingresos
    - Distribución por categorías
    - Detalle de TODAS las transacciones
    """
    return await auditoria_service.get_datos_exportacion(evento_id, fecha_desde, fecha_hasta)
