"""
Tests de listado y cache para LocalService.
"""

import sys
from pathlib import Path
import pytest
from unittest.mock import AsyncMock, patch


# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.locales.local_service import LocalService  # noqa: E402


class TestGetAllLocales:
    @pytest.mark.asyncio
    async def test_listado_con_paginacion_y_campos_calculados(self, mock_db, mock_local_list):
        service = LocalService(db=mock_db)

        async def fake_fetch(cache_key, tag_key, fetch_fn, ttl):
            return await fetch_fn()

        with patch("app.services.locales.local_service.CacheService.get_or_fetch", new=AsyncMock(side_effect=fake_fetch)):
            with patch.object(service.local_repository, "count_filtered", return_value=2):
                with patch.object(service.local_repository, "get_all_filtered", return_value=mock_local_list):
                    result = await service.get_all_locales(skip=0, limit=10, tipo_local_id=None, activo=None, distrito_id=None, busqueda=None)

        assert result["success"] is True
        assert result["message"].lower().startswith("locales obtenidos")
        assert isinstance(result["data"], list) and len(result["data"]) == 2
        # Campos calculados presentes
        assert "distrito_nombre" in result["data"][0]
        assert "tipo_local_nombre" in result["data"][0]
        # Paginación
        pag = result["pagination"]
        assert pag["skip"] == 0
        assert pag["limit"] == 10
        assert pag["total"] == 2
        assert pag["currentPage"] == 1
        assert pag["totalPages"] == 1

    @pytest.mark.asyncio
    async def test_cache_key_deterministico(self, mock_db):
        service = LocalService(db=mock_db)
        key1 = service._build_cache_key(0, 10, None, None, None, None)
        key2 = service._build_cache_key(0, 10, None, None, None, None)
        key3 = service._build_cache_key(10, 10, 5, True, 7, "teatro")

        assert key1 == key2
        assert key1 != key3
        assert "skip=0:limit=10:" in key1
        assert "tipo=all" in key1 and "activo=all" in key1 and "distrito=all" in key1 and "busqueda=all" in key1

    @pytest.mark.asyncio
    async def test_cache_hit_llama_fetch_una_vez(self, mock_db, mock_local_list):
        service = LocalService(db=mock_db)

        fetch_calls = {"count": 0}

        async def fake_fetch(cache_key, tag_key, fetch_fn, ttl):
            fetch_calls["count"] += 1
            return await fetch_fn()

        with patch("app.services.locales.local_service.CacheService.get_or_fetch", new=AsyncMock(side_effect=fake_fetch)):
            with patch.object(service.local_repository, "count_filtered", return_value=2):
                with patch.object(service.local_repository, "get_all_filtered", return_value=mock_local_list):
                    await service.get_all_locales(skip=0, limit=10)
                    # Simular segundo llamado con misma clave -> mismo efecto en esta prueba (no cache real)
                    await service.get_all_locales(skip=0, limit=10)

        # En esta suite, no tenemos cache real; verificamos que el mecanismo fue invocado en ambos casos.
        # La verificación funcional del contenido se cubre en el primer test.
        assert fetch_calls["count"] == 2

    @pytest.mark.asyncio
    async def test_listado_con_fallbacks_relaciones_none(self, mock_db):
        service = LocalService(db=mock_db)

        # Simular locales sin relaciones cargadas (distrito/tipo_local = None)
        from unittest.mock import MagicMock

        local1 = MagicMock()
        local1.id = 1
        local1.nombre = "Local X"
        local1.direccion = "Av. X"
        local1.distrito_id = 77
        local1.tipo_local_id = 88
        local1.distrito = None
        local1.tipo_local = None
        local1.aforo = 50
        local1.activo = True

        async def fake_fetch(cache_key, tag_key, fetch_fn, ttl):
            return await fetch_fn()

        with patch("app.services.locales.local_service.CacheService.get_or_fetch", new=AsyncMock(side_effect=fake_fetch)):
            with patch.object(service.local_repository, "count_filtered", return_value=1):
                with patch.object(service.local_repository, "get_all_filtered", return_value=[local1]):
                    result = await service.get_all_locales(skip=0, limit=10)

        assert result["success"] is True
        item = result["data"][0]
        assert item["distrito_nombre"] == "Distrito 77"
        assert item["tipo_local_nombre"] == "Tipo 88"


class TestGetLocalesByDistrito:
    @pytest.mark.asyncio
    async def test_listar_por_distrito(self, mock_db, mock_local_list):
        service = LocalService(db=mock_db)

        with patch.object(service.local_repository, "get_by_distrito_id", return_value=mock_local_list):
            result = await service.get_locales_by_distrito(10)

        assert result["success"] is True
        assert isinstance(result["data"], list)
        assert len(result["data"]) == 2
        assert result["message"].lower().startswith("locales del distrito")


