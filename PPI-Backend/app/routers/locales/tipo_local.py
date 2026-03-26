from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.database.connection import get_db
from app.services.locales.tipo_local_service import TipoLocalService
from app.core.auth.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/tipo-local",
    tags=["tipos-locales"]
)


def get_tipo_local_service(db: AsyncSession = Depends(get_db)) -> TipoLocalService:
    return TipoLocalService(db)


@router.get("/listar/")
async def list_tipos_locales_endpoint(
    current_user = Depends(get_current_admin_user),
    tipo_local_service: TipoLocalService = Depends(get_tipo_local_service)
) -> Dict:
    return await tipo_local_service.get_all_tipos_locales()

@router.get("/{tipo_id}/")
async def get_tipo_local_endpoint(
    tipo_id: int,
    current_user = Depends(get_current_admin_user),
    tipo_local_service: TipoLocalService = Depends(get_tipo_local_service)
) -> Dict:
    return await tipo_local_service.get_tipo_local_by_id(tipo_id)