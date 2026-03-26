from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import logging
import json
from app.repositories.geografia.provincia_repository import ProvinciaRepository
from app.schemas.geografia.provincia import ProvinciaResponse
from app.utils.handlers.response_handler import ResponseHandler
from app.core.infrastructure import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class ProvinciaService:
    def __init__(self, db: AsyncSession):
        self.provincia_repository = ProvinciaRepository(db)
    
    async def get_all_provincias(self) -> Dict:
        cache_key = "provincias:list"
        
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")
        
        logger.info(f"Cache MISS para {cache_key}")
        logger.info("Obteniendo lista de todas las provincias")
        provincias = await self.provincia_repository.get_all()
        provincias_response = [ProvinciaResponse.model_validate(provincia).model_dump() for provincia in provincias]
        response = ResponseHandler.success_list(provincias_response, "Provincias obtenidas exitosamente")
        
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
    
    async def get_provincias_by_departamento(self, departamento_id: int) -> Dict:
        cache_key = f"provincias:departamento:{departamento_id}"
        
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")
        
        logger.info(f"Cache MISS para {cache_key}")
        logger.info(f"Obteniendo provincias del departamento {departamento_id}")
        provincias = await self.provincia_repository.get_by_departamento_id(departamento_id)
        provincias_response = [ProvinciaResponse.model_validate(provincia).model_dump() for provincia in provincias]
        response = ResponseHandler.success_list(provincias_response, f"Provincias del departamento {departamento_id} obtenidas exitosamente")
        
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

