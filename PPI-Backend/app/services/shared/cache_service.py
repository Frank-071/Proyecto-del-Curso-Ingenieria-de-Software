from app.core.infrastructure import redis_client
import asyncio
import logging
import json
from typing import Optional, Dict, Callable, Any, Coroutine

logger = logging.getLogger(__name__)


class CacheService:
    @staticmethod
    def safe_invalidate_async(coro: Coroutine, operation_name: str):
        """
        Fire-and-forget cache invalidation con error handling y logging.
        No bloquea la respuesta HTTP, ejecuta en background.
        """
        async def _wrapper():
            try:
                await coro
                logger.info(f"Cache invalidation success: {operation_name}")
            except Exception as e:
                logger.error(f"Cache invalidation failed [{operation_name}]: {e}", exc_info=True)
        
        return asyncio.create_task(_wrapper())
    
    @staticmethod
    async def get_or_fetch(
        cache_key: str,
        tag_key: str,
        fetch_fn: Callable,
        ttl: int
    ) -> Dict[str, Any]:
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT: {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error leyendo cache {cache_key}: {e}")
        
        logger.info(f"Cache MISS: {cache_key}")
        
        lock_key = f"lock:{cache_key}"
        max_retries = 5
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                lock_acquired = await redis_client.client.setnx(lock_key, "1")
                if lock_acquired:
                    await redis_client.client.expire(lock_key, 10)
                    try:
                        data = await fetch_fn()
                        
                        try:
                            serialized_data = json.dumps(data, default=str)
                            pipe = redis_client.client.pipeline()
                            pipe.setex(cache_key, ttl, serialized_data)
                            pipe.sadd(tag_key, cache_key)
                            await pipe.execute()
                            logger.info(f"Cache guardado: {cache_key}")
                        except Exception as e:
                            logger.warning(f"Error guardando cache {cache_key}: {e}")
                        
                        return data
                    finally:
                        await redis_client.client.delete(lock_key)
                
                await asyncio.sleep(retry_delay)
                
                try:
                    cached_data = await redis_client.client.get(cache_key)
                    if cached_data:
                        logger.info(f"Cache HIT after wait: {cache_key}")
                        return json.loads(cached_data)
                except Exception as e:
                    logger.warning(f"Error leyendo cache en reintento {attempt + 1}: {e}")
                    
            except Exception as e:
                logger.warning(f"Error en lock acquisition intento {attempt + 1}: {e}")
        
        logger.warning(f"Lock timeout para {cache_key}, ejecutando fetch_fn fallback")
        data = await fetch_fn()
        
        try:
            serialized_data = json.dumps(data, default=str)
            pipe = redis_client.client.pipeline()
            pipe.setex(cache_key, ttl, serialized_data)
            pipe.sadd(tag_key, cache_key)
            await pipe.execute()
            logger.info(f"Cache guardado (fallback): {cache_key}")
        except Exception as e:
            logger.warning(f"Error guardando cache (fallback) {cache_key}: {e}")
        
        return data
    
    @staticmethod
    async def invalidate_detail(entity: str, entity_id: int) -> None:
        try:
            cache_key = f"{entity}:detail:{entity_id}"
            await redis_client.client.delete(cache_key)
            logger.info(f"Cache invalidado: {cache_key}")
        except Exception as e:
            logger.warning(f"Error invalidando cache de {entity} {entity_id}: {e}")
    
    @staticmethod
    async def invalidate_lists(entity: str) -> None:
        try:
            tag_key = f"cache_tags:{entity}"
            keys = await redis_client.client.smembers(tag_key)
            if keys:
                await redis_client.client.delete(*keys)
                await redis_client.client.delete(tag_key)
                logger.info(f"Cache invalidado: {len(keys)} listados de {entity}")
        except Exception as e:
            logger.warning(f"Error invalidando cache de listados de {entity}: {e}")
    
    @staticmethod
    async def invalidate_full(entity: str, entity_id: Optional[int] = None) -> None:
        if entity_id is not None:
            await asyncio.gather(
                CacheService.invalidate_detail(entity, entity_id),
                CacheService.invalidate_lists(entity)
            )
        else:
            await CacheService.invalidate_lists(entity)
    
    @staticmethod
    async def invalidate_evento_detail(evento_id: int) -> None:
        await CacheService.invalidate_detail("evento", evento_id)
    
    @staticmethod
    async def invalidate_evento_lists() -> None:
        await CacheService.invalidate_lists("eventos")
    
    @staticmethod
    async def invalidate_evento_full(evento_id: int) -> None:
        await CacheService.invalidate_full("eventos", evento_id)
    
    @staticmethod
    async def invalidate_cliente_perfil(cliente_id: int) -> None:
        """Invalida el cache del perfil de un cliente específico"""
        try:
            cache_key = f"cliente:perfil:{cliente_id}"
            await redis_client.client.delete(cache_key)
            logger.info(f"Cache invalidado: perfil cliente {cliente_id}")
        except Exception as e:
            logger.warning(f"Error invalidando cache de perfil cliente {cliente_id}: {e}")
    
    @staticmethod
    async def invalidate_cliente_entradas(cliente_id: int) -> None:
        """Invalida el cache del listado de entradas de un cliente."""
        try:
            cache_key = f"cliente:entradas:{cliente_id}"
            tag_key = "cache_tags:cliente_entradas"
            pipe = redis_client.client.pipeline()
            pipe.delete(cache_key)
            pipe.srem(tag_key, cache_key)
            await pipe.execute()
            logger.info(f"Cache invalidado: entradas cliente {cliente_id}")
        except Exception as e:
            logger.warning(f"Error invalidando cache de entradas del cliente {cliente_id}: {e}")
    
    @staticmethod
    async def invalidate_eventos_batch(evento_ids: list[int]) -> None:
        """Invalida cache de múltiples eventos en una sola operación"""
        if not evento_ids:
            return
        
        try:
            cache_keys = [f"evento:detail:{eid}" for eid in evento_ids]
            if cache_keys:
                await redis_client.client.delete(*cache_keys)
                logger.info(f"Cache invalidado: {len(cache_keys)} eventos")
        except Exception as e:
            logger.warning(f"Error invalidando cache batch de eventos: {e}")

