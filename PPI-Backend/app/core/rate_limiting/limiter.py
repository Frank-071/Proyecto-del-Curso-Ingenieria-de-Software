from typing import Optional
from fastapi import Request
from app.core.infrastructure.redis_client import redis_client
from app.core.rate_limiting.exceptions import RateLimitExceeded
import logging

logger = logging.getLogger(__name__)


class SimpleRateLimiter:
    def __init__(
        self,
        max_requests: int,
        window_seconds: int,
        key_prefix: str = "rate_limit"
    ):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.key_prefix = key_prefix
    
    def _get_key(self, identifier: str) -> str:
        return f"{self.key_prefix}:{identifier}"
    
    async def check_rate_limit(
        self,
        identifier: str,
        custom_error_message: Optional[str] = None
    ) -> bool:
        key = self._get_key(identifier)
        
        try:
            current_str = await redis_client.client.get(key)
            
            if current_str is None:
                await redis_client.client.set(key, "1", ex=self.window_seconds)
                return True
            
            current_count = await redis_client.client.incr(key)
            
            if current_count > self.max_requests:
                ttl = await redis_client.client.ttl(key)
                retry_after = ttl if ttl > 0 else self.window_seconds
                
                error_msg = custom_error_message or (
                    f"Límite excedido. Máximo {self.max_requests} intentos "
                    f"cada {self.window_seconds} segundos. "
                    f"Intenta de nuevo en {retry_after} segundos."
                )
                
                raise RateLimitExceeded(
                    detail=error_msg,
                    retry_after=retry_after,
                    limit=self.max_requests,
                    window=self.window_seconds
                )
            
            return True
            
        except RateLimitExceeded:
            raise
        except Exception as e:
            logger.error(f"Rate limiter error: {e}", exc_info=True)
            return True
    
    async def get_remaining(self, identifier: str) -> int:
        key = self._get_key(identifier)
        try:
            current_count = await redis_client.client.get(key)
            if current_count is None:
                return self.max_requests
            return max(0, self.max_requests - int(current_count))
        except Exception as e:
            logger.warning(f"Error getting remaining rate limit: {e}")
            return self.max_requests
    
    async def reset(self, identifier: str) -> bool:
        key = self._get_key(identifier)
        try:
            await redis_client.client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Error resetting rate limit: {e}")
            return False


def get_client_identifier(request: Request, additional_key: Optional[str] = None) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    if additional_key:
        return f"{ip}:{additional_key}"
    return ip

