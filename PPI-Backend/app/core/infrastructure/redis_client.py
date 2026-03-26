import redis.asyncio as redis
import json
from typing import Optional, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self._redis_client: redis.Redis = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=settings.REDIS_DB,
            decode_responses=True,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            socket_connect_timeout=settings.REDIS_SOCKET_CONNECT_TIMEOUT,
            socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
            socket_keepalive=settings.REDIS_SOCKET_KEEPALIVE,
            health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL
        )
    
    @property
    def client(self) -> redis.Redis:
        return self._redis_client
    
    async def is_connected(self) -> bool:
        try:
            return await self._redis_client.ping()
        except Exception:
            return False
        
    async def store_registration_token(self, token: str, user_data: Dict[str, Any], ttl_seconds: int = 900) -> bool:
        try:
            key: str = f"registration_token:{token}"
            value: str = json.dumps(user_data, ensure_ascii=False)
            result = await self.client.setex(key, ttl_seconds, value)
            return bool(result)
        except Exception as e:
            logger.error(f"Error almacenando token de registro: {e}")
            return False
    
    async def get_registration_data(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            key: str = f"registration_token:{token}"
            data: Optional[str] = await self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error obteniendo datos de registro: {e}")
            return None
    
    async def delete_registration_token(self, token: str) -> bool:
        try:
            key: str = f"registration_token:{token}"
            result: int = await self.client.delete(key)
            return bool(result)
        except Exception as e:
            logger.error(f"Error eliminando token de registro: {e}")
            return False
    
    async def close(self) -> None:
        await self._redis_client.close()

redis_client = RedisClient()

