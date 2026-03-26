import pytest
from unittest.mock import AsyncMock, MagicMock
from decimal import Decimal
from types import SimpleNamespace

from app.services.pagos.pago_service import PagoService
from app.schemas.pagos import PagoCompletoRequest, DetallePagoRequest


@pytest.mark.asyncio
async def test_crear_pago_con_promocion_aplica_descuento():
    # Arrange
    pago_service = PagoService(db=None)

    # Mock zona repository to return a zone with a price and evento_id
    zona_obj = SimpleNamespace(precio=Decimal('100.00'), evento_id=1)
    pago_service.zona_repository = MagicMock()
    pago_service.zona_repository.get_by_id_all = AsyncMock(return_value=zona_obj)

    # Mock promotion repository to return an active promotion of 10%
    promocion_obj = SimpleNamespace(id=1, porcentaje_promocion=Decimal('10.0'), fecha_inicio=None, fecha_fin=None, activo=True, evento_id=1)
    pago_service.promocion_repository = MagicMock()
    pago_service.promocion_repository.get_by_id = AsyncMock(return_value=promocion_obj)

    # Mock repositories that perform DB actions
    pago_service.pago_repository = MagicMock()
    pago_service.pago_repository.create_sin_commit = AsyncMock(return_value=SimpleNamespace(id=555))

    pago_service.detalle_pago_repository = MagicMock()
    pago_service.detalle_pago_repository.create_bulk_sin_commit = AsyncMock(return_value=[SimpleNamespace(id=777)])

    # Build request with promotion for the detail
    detalle = DetallePagoRequest(zona_id=1, promocion_id=1, cantidad=1, subtotal=Decimal('100.00'))
    pago_request = PagoCompletoRequest(metodo_pago_id=1, detalles=[detalle])

    # Act
    result = await pago_service.crear_pago_completo(
        cliente_id=42,
        request=pago_request,
        descuento_puntos=Decimal('0'),
        descuento_rango=Decimal('0'),
        total_puntos_otorgados=0
    )

    # Assert total should be subtotal - 10% = 90.00
    assert result['total'] == Decimal('90') or float(result['total']) == 90.0
