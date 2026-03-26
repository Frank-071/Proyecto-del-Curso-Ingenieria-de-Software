"""
Fixtures para tests de EventoService.
"""

import sys
from pathlib import Path
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from types import SimpleNamespace
from datetime import datetime, timedelta


# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.schemas.eventos import EventoRequest  # noqa: E402


def build_evento_mock(
    *,
    id: int = 1,
    nombre: str = "Evento X",
    descripcion: str = "Desc",
    icono: str | None = None,
    fecha_hora_inicio=None,
    fecha_hora_fin=None,
    es_nominal: bool = False,
    estado: str = "Borrador",
    local_nombre: str | None = "Local X",
    categoria_nombre: str | None = "Categoria X",
):
    ev = MagicMock()
    ev.id = id
    ev.nombre = nombre
    ev.descripcion = descripcion
    ev.icono = icono
    ev.es_nominal = es_nominal
    ev.estado = estado
    ev.fecha_hora_inicio = fecha_hora_inicio or datetime.now() + timedelta(days=1)
    ev.fecha_hora_fin = fecha_hora_fin or datetime.now() + timedelta(days=2)
    # Relaciones mínimas
    if local_nombre is not None:
        ev.local = SimpleNamespace(nombre=local_nombre, direccion="Direccion X")
    else:
        ev.local = None
    if categoria_nombre is not None:
        ev.categoria_evento = MagicMock()
        ev.categoria_evento.nombre = categoria_nombre
    else:
        ev.categoria_evento = None
    # Zonas
    ev.zonas = []
    return ev


@pytest.fixture
def mock_evento_list():
    return [
        build_evento_mock(id=1, nombre="E1"),
        build_evento_mock(id=2, nombre="E2"),
    ]


@pytest.fixture
def patch_cache_noop():
    """Parchea invalidaciones para evitar efectos colaterales en tests."""
    with patch("app.services.eventos.evento_service.CacheService.invalidate_evento_lists", new=AsyncMock(return_value=None)):
        with patch("app.services.eventos.evento_service.CacheService.invalidate_evento_full", new=AsyncMock(return_value=None)):
            yield


