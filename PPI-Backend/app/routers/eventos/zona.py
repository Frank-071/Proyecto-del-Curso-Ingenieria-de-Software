from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.database.connection import get_db
from app.schemas.eventos import ZonaRequest
from app.services.eventos import ZonaService
from app.core.auth.dependencies import get_current_admin_user
from app.core.auditoria.decorador_router_errores import capturar_errores_router
from app.models.auditoria.log_error import ModuloSistema

router = APIRouter(
    prefix="/zonas",
    tags=["zonas"]
)


def get_zona_service(db: AsyncSession = Depends(get_db)) -> ZonaService:
    return ZonaService(db)


@router.post("/")
@capturar_errores_router(ModuloSistema.ZONAS)
async def create_zona_endpoint(
    zona_data: ZonaRequest,
    zona_service: ZonaService = Depends(get_zona_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await zona_service.create_zona(zona_data, administrador_id=current_admin.id)


@router.put("/{zona_id}")
@capturar_errores_router(ModuloSistema.ZONAS)
async def update_zona_endpoint(
    zona_data: ZonaRequest,
    zona_id: int = Path(gt=0, description="ID de la zona debe ser mayor a 0"),
    zona_service: ZonaService = Depends(get_zona_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await zona_service.update_zona(zona_id, zona_data, administrador_id=current_admin.id)


@router.get("/evento/{evento_id}")
async def get_zonas_by_evento_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento debe ser mayor a 0"),
    zona_service: ZonaService = Depends(get_zona_service)
) -> Dict:
    return await zona_service.get_zonas_by_evento(evento_id)

