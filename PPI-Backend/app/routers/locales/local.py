
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional
from app.database.connection import get_db
from app.schemas.locales.local import LocalRequest
from app.services.locales.local_service import LocalService
from app.core.auth.dependencies import get_current_admin_user
from app.core.auditoria.decorador_router_errores import capturar_errores_router
from app.models.auditoria.log_error import ModuloSistema

router = APIRouter(
    prefix="/local",
    tags=["locales"]
)



def get_local_service(db: AsyncSession = Depends(get_db)) -> LocalService:
    return LocalService(db)


@router.get("/listar/")
async def list_locals_endpoint(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(10, ge=1, le=5000, description="Número de registros a devolver (máximo 5000)"),
    tipo_local_id: Optional[int] = Query(None, description="Filtrar por tipo de local"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    distrito_id: Optional[int] = Query(None, description="Filtrar por distrito"),
    busqueda: Optional[str] = Query(None, min_length=2, description="Buscar por nombre o dirección (mínimo 2 caracteres)"),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.get_all_locales(
        skip=skip, 
        limit=limit,
        tipo_local_id=tipo_local_id,
        activo=activo,
        distrito_id=distrito_id,
        busqueda=busqueda
    )


@router.get("/test/pending-coords")
async def test_pending_coords(
    limit: int = Query(10, ge=1, le=5000),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.get_pending_locales(limit=limit)


@router.get("/distrito/{distrito_id}")
async def list_locales_by_distrito_endpoint(
    distrito_id: int = Path(gt=0, description="ID del distrito debe ser mayor a 0"),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.get_locales_by_distrito(distrito_id)


@router.get("/{local_id}")
async def get_local_endpoint(
    local_id: int = Path(gt=0, description="ID del local debe ser mayor a 0"),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.get_local_by_id(local_id)


@router.post("/crear/")
@capturar_errores_router(ModuloSistema.LOCALES)
async def create_local_endpoint(
    local_data: LocalRequest,
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.create_local(local_data, administrador_id=current_user.id)


@router.put("/{local_id}")
@capturar_errores_router(ModuloSistema.LOCALES)
async def update_local_endpoint(
    local_data: LocalRequest,
    local_id: int = Path(gt=0, description="ID del local debe ser mayor a 0"),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.update_local(local_id, local_data, administrador_id=current_user.id)


@router.delete("/{local_id}")
@capturar_errores_router(ModuloSistema.LOCALES)
async def delete_local_endpoint(
    local_id: int = Path(gt=0, description="ID del local debe ser mayor a 0"),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.delete_local(local_id, current_user.id)


@router.patch("/cambiar-estado/{local_id}")
async def cambiar_estado_local_endpoint(
    local_id: int = Path(gt=0),
    activar: bool = Query(),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    return await local_service.toggle_local_status(local_id, activar, current_user.id)

