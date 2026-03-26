from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.database.connection import get_db
from app.services.geografia.distrito_service import DistritoService
from app.core.auth.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/distrito",
    tags=["distritos"]
)


def get_distrito_service(db: AsyncSession = Depends(get_db)) -> DistritoService:
    return DistritoService(db)


@router.get("/listar/")
async def list_distritos_endpoint(
    current_user = Depends(get_current_admin_user),
    distrito_service: DistritoService = Depends(get_distrito_service)
) -> Dict:
    return await distrito_service.get_all_distritos()


@router.get("/publicos")
async def list_distritos_publicos_endpoint(
    distrito_service: DistritoService = Depends(get_distrito_service)
) -> Dict:
    """Endpoint público para listar todos los distritos (para filtros públicos)"""
    return await distrito_service.get_all_distritos()


@router.get("/provincia/{provincia_id}")
async def list_distritos_by_provincia_endpoint(
    provincia_id: int = Path(gt=0, description="ID de la provincia debe ser mayor a 0"),
    current_user = Depends(get_current_admin_user),
    distrito_service: DistritoService = Depends(get_distrito_service)
) -> Dict:
    return await distrito_service.get_distritos_by_provincia(provincia_id)

