import sys
from pathlib import Path
import pytest
from unittest.mock import AsyncMock


# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.locales.local_service import LocalService  # noqa: E402


@pytest.fixture
def mock_db_session():
    return AsyncMock()


@pytest.fixture
def service(mock_db_session):
    service = LocalService(mock_db_session)
    service.local_repository = AsyncMock()
    service.tipo_local_repository = AsyncMock()
    return service


@pytest.mark.asyncio
async def test_get_all_locales_smoke(service):
    service.local_repository.count_filtered = AsyncMock(return_value=1)
    mock_local = type(
        "Local",
        (),
        {
            "id": 1,
            "nombre": "Local X",
            "direccion": "Av. X",
            "distrito_id": 77,
            "tipo_local_id": 5,
            "distrito": None,
            "tipo_local": None,
            "aforo": 100,
            "activo": True,
        },
    )()
    service.local_repository.get_all_filtered = AsyncMock(return_value=[mock_local])

    async def fake_fetch(cache_key, tag_key, fetch_fn, ttl):
        return await fetch_fn()

    import app.services.locales.local_service as m
    orig = m.CacheService.get_or_fetch
    m.CacheService.get_or_fetch = AsyncMock(side_effect=fake_fetch)
    try:
        result = await service.get_all_locales(skip=0, limit=10)
    finally:
        m.CacheService.get_or_fetch = orig

    assert result["success"] is True
    assert len(result["data"]) == 1
    assert result["data"][0]["distrito_nombre"] == "Distrito 77"


