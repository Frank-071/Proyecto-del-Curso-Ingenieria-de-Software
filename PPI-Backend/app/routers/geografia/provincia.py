from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.database.connection import get_db
from app.services.geografia.provincia_service import ProvinciaService
from app.core.auth.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/provincia",
    tags=["provincias"]
)


def get_provincia_service(db: AsyncSession = Depends(get_db)) -> ProvinciaService:
    return ProvinciaService(db)


@router.get("/listar/")
async def list_provincias_endpoint(
    current_user = Depends(get_current_admin_user),
    provincia_service: ProvinciaService = Depends(get_provincia_service)
) -> Dict:
    return await provincia_service.get_all_provincias()


@router.get("/departamento/{departamento_id}")
async def list_provincias_by_departamento_endpoint(
    departamento_id: int = Path(gt=0, description="ID del departamento debe ser mayor a 0"),
    current_user = Depends(get_current_admin_user),
    provincia_service: ProvinciaService = Depends(get_provincia_service)
) -> Dict:
    return await provincia_service.get_provincias_by_departamento(departamento_id)

