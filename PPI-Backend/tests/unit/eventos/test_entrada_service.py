"""
Tests unitarios para EntradaService.

Se siguen las convenciones de los tests de `EventoService`: usar fixtures `mock_db` y
parches para `CacheService` cuando sea necesario.
"""

import sys
from pathlib import Path
from types import SimpleNamespace
from decimal import Decimal
from datetime import datetime
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# Insert root to import app
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.eventos.entrada_service import EntradaService  # noqa: E402
from app.core.exceptions import BusinessError  # noqa: E402


class DummyEntradaData:
    def __init__(self, zona_id: int, cliente_id: int):
        self.zona_id = zona_id
        self.cliente_id = cliente_id

    def model_dump(self):
        return {
            "zona_id": self.zona_id,
            "cliente_id": self.cliente_id,
            "fue_transferida": False,
            "escaneada": False,
            "estado_nominacion": "Pendiente",
            "puntos_generados": 0,
        }


class DummyResult:
    def __init__(self, rowcount: int):
        self.rowcount = rowcount


@pytest.mark.asyncio
async def test_create_entrada_success(mock_db, patch_cache_noop):
    """Caso feliz: hay stock y se crea la entrada."""
    # Preparar mocks en la sesión
    mock_db.execute = AsyncMock(return_value=DummyResult(rowcount=1))

    async def _refresh(obj):
        try:
            setattr(obj, "id", 1)
        except Exception:
            pass
        return None

    mock_db.refresh = AsyncMock(side_effect=_refresh)

    # Zona devolvida por el repo
    zona = SimpleNamespace(id=1, evento_id=10, precio=Decimal("50.0"))

    service = EntradaService(db=mock_db)
    service.zona_repository.get_by_id_all = AsyncMock(return_value=zona)

    # Evitar notificaciones reales
    with patch("app.services.eventos.entrada_service.NotificacionService.schedule_for_entrada", new=AsyncMock(return_value=None)):
        entrada_data = DummyEntradaData(zona_id=1, cliente_id=100)
        result = await service.create_entrada(entrada_data)

    assert isinstance(result, dict)
    assert result.get("success") is True
    mock_db.execute.assert_called()
    mock_db.commit.assert_called()


@pytest.mark.asyncio
async def test_create_entrada_no_stock(mock_db):
    """Si no hay stock, el servicio debe lanzar BusinessError y hacer rollback."""
    mock_db.execute = AsyncMock(return_value=DummyResult(rowcount=0))

    async def _refresh(obj):
        try:
            setattr(obj, "id", 1)
        except Exception:
            pass
        return None

    mock_db.refresh = AsyncMock(side_effect=_refresh)

    zona = SimpleNamespace(id=1, evento_id=10, precio=Decimal("50.0"))

    service = EntradaService(db=mock_db)
    service.zona_repository.get_by_id_all = AsyncMock(return_value=zona)

    with patch("app.services.eventos.entrada_service.NotificacionService.schedule_for_entrada", new=AsyncMock(return_value=None)):
        entrada_data = DummyEntradaData(zona_id=1, cliente_id=100)
        with pytest.raises(BusinessError) as exc:
            await service.create_entrada(entrada_data)

    assert exc.value.status_code == 400


def test_build_email_entries_payload(mock_db):
    """La data para correos debe incluir datos del evento y zona."""
    service = EntradaService(db=mock_db)

    evento = SimpleNamespace(
        nombre="Rock Fest",
        fecha_hora_inicio=datetime(2025, 5, 20, 21, 0)
    )
    zona = SimpleNamespace(
        nombre="VIP",
        descripcion="VIP GOLD",
        precio=Decimal("150.50"),
        evento=evento
    )
    entrada = SimpleNamespace(id=123, zona=zona)

    payload = service._build_email_entries_payload([entrada])

    assert len(payload) == 1
    item = payload[0]
    assert item["eventName"] == "Rock Fest"
    assert item["zone"] == "VIP"
    assert item["ticketType"] == "VIP GOLD"
    assert item["price"] == pytest.approx(150.5)
    assert item["quantity"] == 1
