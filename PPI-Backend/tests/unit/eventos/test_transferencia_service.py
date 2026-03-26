"""
Tests unitarios para TransferenciaService.

Se mantienen las convenciones del resto de tests en `tests/unit/eventos`.
"""

import sys
from pathlib import Path
from types import SimpleNamespace
import pytest
from unittest.mock import AsyncMock, patch


# Insert root to import app
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.eventos.transferencia_service import TransferenciaService  # noqa: E402
from app.schemas.eventos.transferencia import TransferPreviewRequest  # noqa: E402
from app.core.exceptions import BusinessError  # noqa: E402


@pytest.mark.asyncio
async def test_preview_transfer_success(mock_db):
    """Preview exitoso: destinatario existe y se devuelve resumen por evento/zona."""
    # Datos de entrada
    entrada_ids = [101, 102]
    req = TransferPreviewRequest(emisor_cliente_id=1, destinatario_dni="12345678", entrada_ids=entrada_ids)

    # Patches a funciones del repositorio importadas en el módulo
    with patch("app.services.eventos.transferencia_service.find_cliente_by_dni", new=AsyncMock(return_value=200)):
        # get_entradas_de_emisor devuelve lista de dicts con entrada_id
        entradas = [{"entrada_id": 101}, {"entrada_id": 102}]
        with patch("app.services.eventos.transferencia_service.get_entradas_de_emisor", new=AsyncMock(return_value=entradas)):
            with patch("app.services.eventos.transferencia_service.entradas_ya_transferidas", new=lambda e: False):
                grupos = [(10, "Evento X", 5, "Zona A", 2)]
                with patch("app.services.eventos.transferencia_service.resumen_por_evento_zona", new=AsyncMock(return_value=grupos)):
                    service = TransferenciaService(db=mock_db)
                    resp = await service.preview_transfer(req)

    assert resp.destinatario_cliente_id == 200
    assert resp.total == 2
    assert len(resp.grupos) == 1


@pytest.mark.asyncio
async def test_preview_transfer_dest_not_found(mock_db):
    """Si el destinatario no existe por DNI, se arroja BusinessError 404."""
    entrada_ids = [101]
    req = TransferPreviewRequest(emisor_cliente_id=1, destinatario_dni="00000000", entrada_ids=entrada_ids)

    with patch("app.services.eventos.transferencia_service.find_cliente_by_dni", new=AsyncMock(return_value=None)):
        service = TransferenciaService(db=mock_db)
        with pytest.raises(BusinessError) as exc:
            await service.preview_transfer(req)

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_confirm_transfer_success(mock_db):
    """Confirm successful transfer: procesa puntos, mueve entradas, inserta transferencias y hace commit."""
    entrada_ids = [201, 202]
    req = TransferPreviewRequest(emisor_cliente_id=2, destinatario_dni="87654321", entrada_ids=entrada_ids)

    # Simular find_cliente_by_dni -> dest_id
    with patch("app.services.eventos.transferencia_service.find_cliente_by_dni", new=AsyncMock(return_value=300)):
        # Primer get_entradas_de_emisor (for_update=False) y luego (for_update=True)
        entradas = [{"entrada_id": 201}, {"entrada_id": 202}]
        get_entries_mock = AsyncMock(side_effect=[entradas, entradas])
        with patch("app.services.eventos.transferencia_service.get_entradas_de_emisor", new=get_entries_mock):
            with patch("app.services.eventos.transferencia_service.entradas_ya_transferidas", new=lambda e: False):
                # Evitar procesar puntos reales: parchear el método interno
                with patch.object(TransferenciaService, "_procesar_descuento_puntos", new=AsyncMock(return_value=None)):
                    # mover_entradas devuelve updated count igual al número de entradas
                    with patch("app.services.eventos.transferencia_service.mover_entradas", new=AsyncMock(return_value=len(entrada_ids))):
                        # insert_transferencias devuelve lista de ids
                        with patch("app.services.eventos.transferencia_service.insert_transferencias", new=AsyncMock(return_value=[11, 12])):
                            service = TransferenciaService(db=mock_db)
                            resp = await service.confirm_transfer(req)

    assert resp.transferidas == 2
    assert resp.transferencia_ids == [11, 12]
    mock_db.commit.assert_called()


@pytest.mark.asyncio
async def test_confirm_transfer_concurrent_change(mock_db):
    """Si al bloquear las entradas no se obtienen todas, debe tirar BusinessError 409 (concurrency)."""
    entrada_ids = [301, 302]
    req = TransferPreviewRequest(emisor_cliente_id=3, destinatario_dni="11112222", entrada_ids=entrada_ids)

    with patch("app.services.eventos.transferencia_service.find_cliente_by_dni", new=AsyncMock(return_value=400)):
        # Primer call returns full list, second (locked) returns shorter list to simulate concurrent change
        entradas = [{"entrada_id": 301}, {"entrada_id": 302}]
        locked = [{"entrada_id": 301}]  # only one locked
        get_entries_mock = AsyncMock(side_effect=[entradas, locked])
        with patch("app.services.eventos.transferencia_service.get_entradas_de_emisor", new=get_entries_mock):
            with patch("app.services.eventos.transferencia_service.entradas_ya_transferidas", new=lambda e: False):
                service = TransferenciaService(db=mock_db)
                with pytest.raises(BusinessError) as exc:
                    await service.confirm_transfer(req)

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_confirm_transfer_already_transferred(mock_db):
    """Si algunas entradas ya fueron transferidas, se debe lanzar BusinessError 409."""
    entrada_ids = [401]
    req = TransferPreviewRequest(emisor_cliente_id=4, destinatario_dni="22223333", entrada_ids=entrada_ids)

    with patch("app.services.eventos.transferencia_service.find_cliente_by_dni", new=AsyncMock(return_value=500)):
        entradas = [{"entrada_id": 401}]
        with patch("app.services.eventos.transferencia_service.get_entradas_de_emisor", new=AsyncMock(return_value=entradas)):
            # entradas_ya_transferidas returns non-empty list indicating already transferred
            with patch("app.services.eventos.transferencia_service.entradas_ya_transferidas", new=lambda e: [401]):
                service = TransferenciaService(db=mock_db)
                with pytest.raises(BusinessError) as exc:
                    await service.preview_transfer(req)

    assert exc.value.status_code == 409
