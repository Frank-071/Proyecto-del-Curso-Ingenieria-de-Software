import hashlib
import json
import logging
from typing import Optional, Tuple

import httpx
import asyncio

from app.core.infrastructure import redis_client
from app.core.config import settings
from app.core.rate_limiting.limiter import SimpleRateLimiter

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

_client: Optional[httpx.AsyncClient] = None

_rate_window = int(getattr(settings, "GEOCODER_RATE_WINDOW", 1))
_rate_max = int(getattr(settings, "GEOCODER_RATE_MAX", 1))
_limiter = SimpleRateLimiter(max_requests=_rate_max, window_seconds=_rate_window)


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=10.0)
    return _client


def _cache_key_for(query: str) -> str:
    h = hashlib.sha1(query.encode("utf-8")).hexdigest()
    return f"geocode:{h}"


async def _fetch_from_provider(query: str) -> Optional[Tuple[float, float]]:
    client = _get_client()
    params = {"q": query, "format": "json", "limit": 1}
    headers = {"User-Agent": settings.APP_NAME}
    if getattr(settings, "FROM_EMAIL", None):
        headers["From"] = settings.FROM_EMAIL

    max_attempts = int(getattr(settings, "GEOCODER_MAX_RETRIES", 3))
    backoff_base = float(getattr(settings, "GEOCODER_BACKOFF_BASE", 0.5))

    for attempt in range(1, max_attempts + 1):
        try:
            await _limiter.check_rate_limit("geocode")
            resp = await client.get(NOMINATIM_URL, params=params, headers=headers)
            resp.raise_for_status()
            arr = resp.json()
            if not arr:
                return None
            lat = float(arr[0]["lat"])  # type: ignore[index]
            lon = float(arr[0]["lon"])  # type: ignore[index]
            return lat, lon

        except httpx.HTTPStatusError as e:
            status = e.response.status_code if e.response is not None else None
            logger.warning(f"Geocoder HTTP error (status={status}) on attempt {attempt} for '{query}'")
            if status == 429 or (status and status >= 500):
                sleep_for = backoff_base * (2 ** (attempt - 1))
                await asyncio.sleep(sleep_for)
                continue
            return None
        except Exception as e:
            logger.warning(f"Geocoder request error on attempt {attempt} for '{query}': {e}")
            sleep_for = backoff_base * (2 ** (attempt - 1))
            await asyncio.sleep(sleep_for)
            continue

    logger.error(f"Geocoding failed after {max_attempts} attempts for '{query}'")
    return None


async def geocode_address(query: str) -> Optional[Tuple[float, float]]:
    if not query:
        return None

    key = _cache_key_for(query)
    try:
        cached = await redis_client.client.get(key)
        if cached:
            data = json.loads(cached)
            return float(data["lat"]), float(data["lon"])
    except Exception:
        logger.debug("Redis cache unavailable for geocode")

    coords = await _fetch_from_provider(query)
    if coords:
        try:
            ttl = int(getattr(settings, "GEOCODER_CACHE_TTL", 7 * 24 * 3600))
            await redis_client.client.setex(key, ttl, json.dumps({"lat": coords[0], "lon": coords[1]}))
        except Exception:
            logger.debug("Failed to write geocode to redis cache")

    return coords
