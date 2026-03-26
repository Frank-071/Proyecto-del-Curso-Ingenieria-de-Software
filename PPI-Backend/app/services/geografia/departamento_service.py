from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import logging
import json
from app.repositories.geografia.departamento_repository import DepartamentoRepository
from app.schemas.geografia.departamento import DepartamentoResponse
from app.utils.handlers.response_handler import ResponseHandler
from app.core.infrastructure import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class DepartamentoService:
    def __init__(self, db: AsyncSession):
        self.departamento_repository = DepartamentoRepository(db)
    
    async def get_all_departamentos(self) -> Dict:
        cache_key = "departamentos:list"
        
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")
        
        logger.info(f"Cache MISS para {cache_key}")
        logger.info("Obteniendo lista de todos los departamentos")
        departamentos = await self.departamento_repository.get_all()
        departamentos_response = [DepartamentoResponse.model_validate(departamento).model_dump() for departamento in departamentos]
        response = ResponseHandler.success_list(departamentos_response, "Departamentos obtenidos exitosamente")
        
        try:
            await redis_client.client.setex(
                cache_key,
                settings.CACHE_TTL_EVENTO_LIST,
                json.dumps(response, default=str)
            )
            logger.info(f"Cache guardado para {cache_key}")
        except Exception as e:
            logger.warning(f"Error guardando en Redis: {e}")
        
        return response

