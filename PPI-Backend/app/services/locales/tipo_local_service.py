from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import logging
import json
from app.repositories.locales.tipo_local_repository import TipoLocalRepository
from app.schemas.locales.tipo_local import TipoLocalResponse
from app.utils.handlers.response_handler import ResponseHandler
from app.core.infrastructure import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class TipoLocalService:
    def __init__(self, db: AsyncSession):
        self.tipo_local_repository = TipoLocalRepository(db)
    
    async def get_all_tipos_locales(self) -> Dict:
        cache_key = "tipos_locales:list"
        
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")
        
        logger.info(f"Cache MISS para {cache_key}")
        logger.info("Obteniendo lista de todos los tipos de locales")
        tipos_locales = await self.tipo_local_repository.get_all()
        tipos_locales_response = [TipoLocalResponse.model_validate(tipo).model_dump() for tipo in tipos_locales]
        response = ResponseHandler.success_list(tipos_locales_response, "Tipos de locales obtenidos exitosamente")
        
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
    
    async def get_tipo_local_by_id(self, tipo_id: int) -> Dict:
        cache_key = f"tipos_locales:{tipo_id}"

        # Intentar desde cache
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")

        logger.info(f"Cache MISS para {cache_key}")
        logger.info(f"Obteniendo tipo de local con ID {tipo_id}")
        
        tipo_local = await self.tipo_local_repository.get_by_id(tipo_id)
        if not tipo_local:
            return ResponseHandler.error(f"Tipo de local con ID {tipo_id} no encontrado", status_code=404)

        tipo_local_response = TipoLocalResponse.model_validate(tipo_local).model_dump()
        response = ResponseHandler.success(tipo_local_response, "Tipo de local obtenido exitosamente")

        # Guardar en cache
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
