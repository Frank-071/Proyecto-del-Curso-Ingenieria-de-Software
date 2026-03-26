from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import logging
from app.repositories.eventos.categoria_evento_repository import CategoriaEventoRepository
from app.schemas.eventos.categoria_evento import CategoriaEventoResponse
from app.utils.handlers.response_handler import ResponseHandler

logger = logging.getLogger(__name__)


class CategoriaEventoService:
    def __init__(self, db: AsyncSession):
        self.categoria_evento_repository = CategoriaEventoRepository(db)
    
    async def get_all_categorias_evento(self) -> Dict:
        logger.info("Obteniendo lista de todas las categorías de evento")
        categorias_evento = await self.categoria_evento_repository.get_all()
        categorias_evento_response = [CategoriaEventoResponse.model_validate(categoria) for categoria in categorias_evento]
        return ResponseHandler.success_list(categorias_evento_response, "Categorías de evento obtenidas exitosamente")

