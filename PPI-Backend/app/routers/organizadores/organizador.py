from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.connection import get_db
from app.schemas.organizadores.organizador import OrganizadorCreate, OrganizadorUpdate, OrganizadorResponse
from app.services.organizadores.organizador_service import OrganizadorService

router = APIRouter(
    prefix="/organizador",
    tags=["organizadores"]
)

def get_organizador_service(db: AsyncSession = Depends(get_db)) -> OrganizadorService:
    return OrganizadorService(db)

@router.get("/listar/")
async def list_organizadores_endpoint(service: OrganizadorService = Depends(get_organizador_service)):
    return await service.get_all_organizadores()

@router.post("/crear/")
async def create_organizador_endpoint(
    organizador_data: OrganizadorCreate,
    service: OrganizadorService = Depends(get_organizador_service)
):
    return await service.create_organizador(organizador_data)





