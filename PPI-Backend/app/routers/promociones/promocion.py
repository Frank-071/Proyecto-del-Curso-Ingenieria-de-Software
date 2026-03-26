from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict
from app.database.connection import get_db
from app.services.promociones import PromocionService
from app.schemas.promociones import PromocionCreateRequest, PromocionUpdateRequest
from app.core.auth.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/promociones",
    tags=["promociones"]
)


def get_promocion_service(db: AsyncSession = Depends(get_db)) -> PromocionService:
    return PromocionService(db)


@router.get("/publicos")
async def list_promociones_publicas(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    promocion_service: PromocionService = Depends(get_promocion_service)
) -> Dict:
    return await promocion_service.get_all_promociones(skip=skip, limit=limit, activo=True)


@router.get("/listar")
async def list_promociones(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    activo: Optional[bool] = Query(None),
    promocion_service: PromocionService = Depends(get_promocion_service)
) -> Dict:
    return await promocion_service.get_all_promociones(skip=skip, limit=limit, activo=activo)


@router.get("/{promocion_id}")
async def get_promocion(
    promocion_id: int = Path(gt=0),
    promocion_service: PromocionService = Depends(get_promocion_service)
) -> Dict:
    return await promocion_service.get_promocion_by_id(promocion_id)


@router.post("/")
async def create_promocion(
    promocion_data: PromocionCreateRequest,
    promocion_service: PromocionService = Depends(get_promocion_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await promocion_service.create_promocion(promocion_data)


@router.put("/{promocion_id}")
async def update_promocion(
    promocion_id: int = Path(gt=0),
    promocion_data: PromocionUpdateRequest = ...,
    promocion_service: PromocionService = Depends(get_promocion_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await promocion_service.update_promocion(promocion_id, promocion_data)


@router.delete("/{promocion_id}")
async def delete_promocion(
    promocion_id: int = Path(gt=0),
    promocion_service: PromocionService = Depends(get_promocion_service),
    current_admin = Depends(get_current_admin_user)
) -> Dict:
    return await promocion_service.delete_promocion(promocion_id)
