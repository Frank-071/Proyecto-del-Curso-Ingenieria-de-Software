from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.database.connection import get_db
from app.services.eventos.categoria_evento_service import CategoriaEventoService

router = APIRouter(
    prefix="/categoria-evento",
    tags=["categorias-evento"]
)


def get_categoria_evento_service(db: AsyncSession = Depends(get_db)) -> CategoriaEventoService:
    return CategoriaEventoService(db)


@router.get("/listar/")
async def list_categorias_evento_endpoint(categoria_evento_service: CategoriaEventoService = Depends(get_categoria_evento_service)) -> Dict:
    return await categoria_evento_service.get_all_categorias_evento()

