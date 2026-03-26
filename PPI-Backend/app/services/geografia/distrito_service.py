from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import logging
import json
from app.repositories.geografia.distrito_repository import DistritoRepository
from app.schemas.geografia.distrito import DistritoResponse
from app.utils.handlers.response_handler import ResponseHandler
from app.core.infrastructure import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class DistritoService:
    def __init__(self, db: AsyncSession):
        self.distrito_repository = DistritoRepository(db)
    
    async def get_all_distritos(self) -> Dict:
        cache_key = "distritos:list"
        
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")
        
        logger.info(f"Cache MISS para {cache_key}")
        logger.info("Obteniendo lista de todos los distritos")
        distritos = await self.distrito_repository.get_all()
        distritos_response = [DistritoResponse.model_validate(distrito).model_dump() for distrito in distritos]
        response = ResponseHandler.success_list(distritos_response, "Distritos obtenidos exitosamente")
        
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
    
    async def get_distritos_by_provincia(self, provincia_id: int) -> Dict:
        cache_key = f"distritos:provincia:{provincia_id}"
        
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")
        
        logger.info(f"Cache MISS para {cache_key}")
        logger.info(f"Obteniendo distritos de la provincia {provincia_id}")
        distritos = await self.distrito_repository.get_by_provincia_id(provincia_id)
        distritos_response = [DistritoResponse.model_validate(distrito).model_dump() for distrito in distritos]
        response = ResponseHandler.success_list(distritos_response, f"Distritos de la provincia {provincia_id} obtenidos exitosamente")
        
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

