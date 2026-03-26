import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.locales.local_service import LocalService
from app.core.exceptions import BusinessError


@pytest.fixture
def mock_db_session():
    """Simula una sesión de base de datos para inyectar en el servicio."""
    return AsyncMock()


@pytest.fixture
def service(mock_db_session):
    """Crea una instancia de LocalService con dependencias mockeadas."""
    service = LocalService(mock_db_session)
    service.local_repository = AsyncMock()
    service.tipo_local_repository = AsyncMock()
    return service


@pytest.mark.asyncio
async def test_get_local_by_id_exitoso(service):
    mock_local = MagicMock()
    mock_local.id = 1
    mock_local.nombre = "Local Centro"
    mock_local.direccion = "Av. Siempre Viva 123"
    mock_local.activo = True
    mock_local.tipo_local_id = 2
    mock_local.tipo_local = MagicMock(nombre="Tienda")
    mock_local.distrito_id = 1
    mock_local.distrito = MagicMock(nombre="Cusco")

    service.local_repository.get_by_id_with_relations.return_value = mock_local

    result = await service.get_local_by_id(1)

    assert result["success"] is True
    assert "Local obtenido exitosamente" in result["message"]
    service.local_repository.get_by_id_with_relations.assert_awaited_once_with(1)


@pytest.mark.asyncio
async def test_get_local_by_id_no_existe(service):
    service.local_repository.get_by_id_with_relations.return_value = None

    with pytest.raises(BusinessError, match="no encontrado"):
        await service.get_local_by_id(999)



@pytest.mark.asyncio
@patch("app.services.locales.local_service.CacheService.safe_invalidate_async")
async def test_create_local_exitoso(mock_invalidate, service):
    class DummyRequest:
        nombre = "Local Nuevo"
        direccion = "Av. Central 100"
        tipo_local_id = 1
        distrito_id = 1
        def model_dump(self):
            return {
                "nombre": self.nombre,
                "direccion": self.direccion,
                "tipo_local_id": self.tipo_local_id,
                "distrito_id": self.distrito_id,
            }

    service.tipo_local_repository.exists.return_value = True

    mock_created = MagicMock()
    mock_created.id = 1
    mock_created.nombre = "Local Nuevo"
    mock_created.direccion = "Av. Central 100"
    mock_created.activo = True
    mock_created.tipo_local_id = 1
    mock_created.distrito_id = 1
    mock_created.tipo_local = MagicMock(nombre="Tienda")
    mock_created.distrito = MagicMock(nombre="Cusco")

    service.local_repository.create.return_value = mock_created

    result = await service.create_local(DummyRequest())

    assert result["success"] is True
    assert "creado exitosamente" in result["message"]
    mock_invalidate.assert_called_once()


@pytest.mark.asyncio
async def test_create_local_tipo_local_no_existe(service):
    class DummyRequest:
        nombre = "Local Fallido"
        tipo_local_id = 999
        def model_dump(self): return {"nombre": self.nombre, "tipo_local_id": 999}

    service.tipo_local_repository.exists.return_value = False

    with pytest.raises(BusinessError, match="Tipo de local no encontrado"):
        await service.create_local(DummyRequest())



@pytest.mark.asyncio
@patch("app.services.locales.local_service.CacheService.invalidate_lists")
async def test_update_local_exitoso(mock_invalidate, service):
    class DummyRequest:
        nombre = "Local Actualizado"
        direccion = "Av. Nueva 200"
        tipo_local_id = 1
        distrito_id = 1
        def model_dump(self):
            return {
                "nombre": self.nombre,
                "direccion": self.direccion,
                "tipo_local_id": self.tipo_local_id,
                "distrito_id": self.distrito_id,
            }

    service.tipo_local_repository.exists.return_value = True

    mock_updated = MagicMock()
    mock_updated.id = 1
    mock_updated.nombre = "Local Actualizado"
    mock_updated.direccion = "Av. Nueva 200"
    mock_updated.activo = True
    mock_updated.tipo_local_id = 1
    mock_updated.distrito_id = 1
    mock_updated.tipo_local = MagicMock(nombre="Boutique")
    mock_updated.distrito = MagicMock(nombre="Cusco")

    service.local_repository.update.return_value = mock_updated

    result = await service.update_local(1, DummyRequest())

    assert result["success"] is True
    assert "actualizado" in result["message"]
    mock_invalidate.assert_awaited()



@pytest.mark.asyncio
@patch("app.services.locales.local_service.CacheService.invalidate_lists")
async def test_delete_local_exitoso(mock_invalidate, service):
    service.local_repository.delete.return_value = True

    result = await service.delete_local(1)

    assert result["success"] is True
    assert "eliminado" in result["message"]
    service.local_repository.delete.assert_awaited_once_with(1)
    mock_invalidate.assert_awaited()


@pytest.mark.asyncio
@patch("app.services.locales.local_service.CacheService.invalidate_lists")
async def test_toggle_local_status_exitoso(mock_invalidate, service):
    mock_local = MagicMock(id=1, activo=True)
    service.local_repository.get_by_id_all.return_value = mock_local
    service.local_repository.update.return_value = True

    result = await service.toggle_local_status(1, False)

    assert result["success"] is True
    assert "desactivado" in result["message"]
    service.local_repository.update.assert_awaited_once_with(1, {"activo": False})
    mock_invalidate.assert_awaited()


@pytest.mark.asyncio
async def test_toggle_local_status_no_existe(service):
    # Simula que no existe
    service.local_repository.get_by_id_all.return_value = None

    with pytest.raises(BusinessError) as excinfo:
        await service.toggle_local_status(999, True)

    # Validamos el mensaje general
    assert "Error interno" in str(excinfo.value)
