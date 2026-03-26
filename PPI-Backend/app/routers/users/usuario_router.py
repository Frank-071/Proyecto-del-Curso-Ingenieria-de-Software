from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional
from app.database.connection import get_db
from app.schemas.auth.usuario import UsuarioRequest  # Corrige la ruta de importación
from app.services.auth.usuario_service import UsuarioService
from app.core.auth.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/usuario",
    tags=["usuarios"]
)

def get_usuario_service(db: AsyncSession = Depends(get_db)) -> UsuarioService:
    return UsuarioService(db)


@router.get("/listar/")
async def list_usuarios_endpoint(
    skip: int = Query(0, ge=0, description="Registros a omitir"),
    limit: int = Query(10, ge=1, le=5000, description="Registros a devolver"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    busqueda: Optional[str] = Query(None, min_length=2, description="Buscar por nombre, apellido, email o documento"),
    current_user = Depends(get_current_admin_user),
    usuario_service: UsuarioService = Depends(get_usuario_service)
) -> Dict:
    return await usuario_service.get_all_usuarios_new(
        skip=skip,
        limit=limit,
        activo=activo,
        busqueda=busqueda
    )

@router.patch("/cambiar-estado/{usuario_id}")
async def cambiar_estado_usuario_endpoint(
    usuario_id: int = Path(gt=0),
    activar: bool = Query(..., description="true=activar, false=desactivar"),
    current_user = Depends(get_current_admin_user),
    usuario_service: UsuarioService = Depends(get_usuario_service)
) -> Dict:
    return await usuario_service.toggle_usuario_status(usuario_id, activar, current_user.id)
