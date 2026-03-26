"""
Fixtures para tests de LocalService.
"""

import sys
from pathlib import Path
from datetime import datetime
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.schemas.locales.local import LocalResponse  # noqa: E402


def _build_mock_local(
    *,
    id: int = 1,
    nombre: str = "Local Test",
    direccion: str = "Av. Siempre Viva 123",
    distrito_id: int = 10,
    distrito_nombre: str | None = "Lima",
    tipo_local_id: int = 5,
    tipo_local_nombre: str | None = "Teatro",
    aforo: int = 100,
    activo: bool = True,
):
    local = MagicMock()
    local.id = id
    local.nombre = nombre
    local.direccion = direccion
    local.distrito_id = distrito_id
    local.tipo_local_id = tipo_local_id
    local.aforo = aforo
    local.activo = activo
    # Relaciones
    if distrito_nombre is not None:
        distrito = MagicMock()
        distrito.nombre = distrito_nombre
        local.distrito = distrito
    else:
        local.distrito = None

    if tipo_local_nombre is not None:
        tipo_local = MagicMock()
        tipo_local.nombre = tipo_local_nombre
        local.tipo_local = tipo_local
    else:
        local.tipo_local = None

    return local


@pytest.fixture
def mock_local_obj():
    return _build_mock_local()


@pytest.fixture
def mock_local_list():
    return [
        _build_mock_local(id=1, nombre="Local A", distrito_id=10, distrito_nombre="Lima", tipo_local_id=5, tipo_local_nombre="Teatro"),
        _build_mock_local(id=2, nombre="Local B", distrito_id=11, distrito_nombre="Callao", tipo_local_id=6, tipo_local_nombre="Estadio"),
    ]


@pytest.fixture
def validate_local_response():
    def _validate(local_like):
        # Asegura que LocalResponse puede validar el objeto simulado
        res = LocalResponse.model_validate(local_like)
        assert res.id is not None
        return res
    return _validate


@pytest.fixture
def patch_safe_invalidate_async():
    def _fake(coro, tag):
        # No-op para tests: evita warnings y tareas pendientes
        return None

    with patch("app.services.locales.local_service.CacheService.safe_invalidate_async", new=_fake):
        # En create_local se pasa la corrutina de invalidate_lists; devolvemos None para evitar crear corrutina
        with patch("app.services.locales.local_service.CacheService.invalidate_lists", new=lambda *args, **kwargs: None):
            yield


