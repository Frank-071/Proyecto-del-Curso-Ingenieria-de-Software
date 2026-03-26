"""
Tests de listado y utilidades para EventoService.
"""

import sys
from pathlib import Path
import pytest
from unittest.mock import AsyncMock, patch


root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.eventos.evento_service import EventoService  # noqa: E402


class TestGetAllEventos:
    @pytest.mark.asyncio
    async def test_listado_con_paginacion_y_campos(self, mock_db, mock_evento_list):
        service = EventoService(db=mock_db)

        async def fake_fetch(cache_key, tag_key, fetch_fn, ttl):
            return await fetch_fn()

        with patch("app.services.eventos.evento_service.CacheService.get_or_fetch", new=AsyncMock(side_effect=fake_fetch)):
            with patch.object(service.evento_repository, "count_filtered", return_value=2):
                with patch.object(service.evento_repository, "get_all_filtered", return_value=mock_evento_list):
                    result = await service.get_all_eventos(skip=0, limit=10)

        assert result["success"] is True
        assert result["pagination"]["total"] == 2
        assert isinstance(result["data"], list) and len(result["data"]) == 2
        # Campo agregado local_nombre debe existir
        assert "local_nombre" in result["data"][0]

    @pytest.mark.asyncio
    async def test_cache_key_deterministico(self, mock_db):
        service = EventoService(db=mock_db)
        k1 = service._build_cache_key(0, 10, None, None, None, None)
        k2 = service._build_cache_key(0, 10, None, None, None, None)
        k3 = service._build_cache_key(10, 10, 3, "Publicado", "este_mes", "rock")
        assert k1 == k2 and k1 != k3


class TestPeriodo:
    def test_calcular_periodo(self, mock_db):
        service = EventoService(db=mock_db)
        i1, f1 = service._calcular_periodo("proximos_7_dias")
        assert i1 is not None and f1 is not None and f1 > i1
        i2, f2 = service._calcular_periodo("este_mes")
        assert i2 is not None and f2 is not None and f2 > i2
        i3, f3 = service._calcular_periodo("proximo_mes")
        assert i3 is not None and f3 is not None and f3 > i3
        inone, fnone = service._calcular_periodo("desconocido")
        assert inone is None and fnone is None


class TestPublicos:
    @pytest.mark.asyncio
    async def test_get_eventos_publicos_ok(self, mock_db, mock_evento_list):
        service = EventoService(db=mock_db)

        async def fake_fetch(cache_key, tag_key, fetch_fn, ttl):
            return await fetch_fn()

        with patch("app.services.eventos.evento_service.CacheService.get_or_fetch", new=AsyncMock(side_effect=fake_fetch)):
            with patch.object(service.evento_repository, "count_all", return_value=2):
                with patch.object(service.evento_repository, "get_all_with_local_public", return_value=mock_evento_list):
                    result = await service.get_eventos_publicos(skip=0, limit=10)

        assert result["success"] is True
        assert result["pagination"]["total"] == 2
        assert "categoria_nombre" in result["data"][0]


