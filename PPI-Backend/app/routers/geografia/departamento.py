from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.database.connection import get_db
from app.services.geografia.departamento_service import DepartamentoService
from app.core.auth.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/departamento",
    tags=["departamentos"]
)


def get_departamento_service(db: AsyncSession = Depends(get_db)) -> DepartamentoService:
    return DepartamentoService(db)


@router.get("/listar/")
async def list_departamentos_endpoint(
    current_user = Depends(get_current_admin_user),
    departamento_service: DepartamentoService = Depends(get_departamento_service)
) -> Dict:
    return await departamento_service.get_all_departamentos()

