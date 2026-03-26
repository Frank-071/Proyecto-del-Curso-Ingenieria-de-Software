"""
Tests de CRUD y estado para LocalService.
"""

import sys
from pathlib import Path
import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy.exc import IntegrityError


# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.locales.local_service import LocalService  # noqa: E402
from app.schemas.locales.local import LocalRequest, LocalResponse  # noqa: E402
from app.core.exceptions import BusinessError  # noqa: E402


class TestGetLocalById:
    @pytest.mark.asyncio
    async def test_get_por_id_exitoso(self, mock_db, mock_local_obj):
        service = LocalService(db=mock_db)
        with patch.object(service.local_repository, "get_by_id_with_relations", return_value=mock_local_obj):
            result = await service.get_local_by_id(1)

        assert result["success"] is True
        res = result["data"]
        # Asegura que LocalResponse valida
        LocalResponse.model_validate(res)

    @pytest.mark.asyncio
    async def test_get_por_id_no_encontrado(self, mock_db):
        service = LocalService(db=mock_db)
        with patch.object(service.local_repository, "get_by_id_with_relations", return_value=None):
            with pytest.raises(BusinessError) as exc:
                await service.get_local_by_id(999)
        assert exc.value.status_code == 404


class TestCreateLocal:
    @pytest.mark.asyncio
    async def test_crear_exitoso(self, mock_db, patch_safe_invalidate_async):
        service = LocalService(db=mock_db)

        request = LocalRequest(
            nombre="Nuevo Local",
            direccion="Av. 123",
            distrito_id=10,
            tipo_local_id=5,
            aforo=100,
            activo=True,
        )

        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=True)):
            fake_local = type(
                "Local",
                (),
                {
                    "id": 123,
                    "nombre": request.nombre,
                    "direccion": request.direccion,
                    "distrito": None,
                    "tipo_local": None,
                    "distrito_id": request.distrito_id,
                    "tipo_local_id": request.tipo_local_id,
                    "aforo": request.aforo,
                    "activo": request.activo,
                },
            )()
            with patch.object(service.local_repository, "create", new=AsyncMock(return_value=fake_local)):
                result = await service.create_local(request)

        assert result["success"] is True
        assert "creado" in result["message"].lower()
        # safe_invalidate_async está parcheado para await-ear la corrutina subyacente y evitar warnings

    @pytest.mark.asyncio
    async def test_crear_integrity_distrito(self, mock_db):
        service = LocalService(db=mock_db)
        request = LocalRequest(
            nombre="Nuevo Local",
            direccion="Av. 123",
            distrito_id=999,
            tipo_local_id=5,
            aforo=100,
            activo=True,
        )

        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=True)):
            err = IntegrityError("", {}, type("Orig", (), {"__str__": lambda self: "foreign key distrito_id"})())
            with patch.object(service.local_repository, "create", new=AsyncMock(side_effect=err)):
                with pytest.raises(BusinessError) as exc:
                    await service.create_local(request)
        assert exc.value.status_code in (400, 404)
        assert "distrito" in str(exc.value).lower()

    @pytest.mark.asyncio
    async def test_crear_integrity_tipo_local(self, mock_db):
        service = LocalService(db=mock_db)
        request = LocalRequest(
            nombre="Nuevo Local",
            direccion="Av. 123",
            distrito_id=10,
            tipo_local_id=999,
            aforo=100,
            activo=True,
        )

        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=True)):
            err = IntegrityError("", {}, type("Orig", (), {"__str__": lambda self: "foreign key tipo_local_id"})())
            with patch.object(service.local_repository, "create", new=AsyncMock(side_effect=err)):
                with pytest.raises(BusinessError) as exc:
                    await service.create_local(request)
        assert exc.value.status_code in (400, 404)
        assert "tipo de local" in str(exc.value).lower()

    @pytest.mark.asyncio
    async def test_crear_integrity_generico(self, mock_db):
        service = LocalService(db=mock_db)
        request = LocalRequest(
            nombre="Nuevo Local",
            direccion="Av. 123",
            distrito_id=10,
            tipo_local_id=5,
            aforo=100,
            activo=True,
        )

        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=True)):
            err = IntegrityError("", {}, type("Orig", (), {"__str__": lambda self: "violates unique"})())
            with patch.object(service.local_repository, "create", new=AsyncMock(side_effect=err)):
                with pytest.raises(BusinessError) as exc:
                    await service.create_local(request)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_crear_falla_tipo_local_no_existe(self, mock_db):
        service = LocalService(db=mock_db)

        request = LocalRequest(
            nombre="Nuevo Local",
            direccion="Av. 123",
            distrito_id=10,
            tipo_local_id=999,
            aforo=100,
            activo=True,
        )

        # exists -> False debe disparar BusinessError 404
        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=False)):
            with pytest.raises(BusinessError) as exc:
                await service.create_local(request)
        assert exc.value.status_code == 404


class TestUpdateLocal:
    @pytest.mark.asyncio
    async def test_actualizar_exitoso(self, mock_db):
        service = LocalService(db=mock_db)
        request = LocalRequest(
            nombre="Local Editado",
            direccion="Av. Editada",
            distrito_id=10,
            tipo_local_id=5,
            aforo=200,
            activo=True,
        )

        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=True)):
            fake_local = type(
                "Local",
                (),
                {
                    "id": 1,
                    "nombre": request.nombre,
                    "direccion": request.direccion,
                    "distrito": None,
                    "tipo_local": None,
                    "distrito_id": request.distrito_id,
                    "tipo_local_id": request.tipo_local_id,
                    "aforo": request.aforo,
                    "activo": request.activo,
                },
            )()
            with patch.object(service.local_repository, "update", new=AsyncMock(return_value=fake_local)):
                with patch("app.services.locales.local_service.CacheService.invalidate_lists", new=AsyncMock(return_value=None)):
                    result = await service.update_local(1, request)

        assert result["success"] is True
        assert "actualizado" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_actualizar_integrity_mapas(self, mock_db):
        service = LocalService(db=mock_db)
        request = LocalRequest(
            nombre="Local Editado",
            direccion="Av. Editada",
            distrito_id=10,
            tipo_local_id=5,
            aforo=200,
            activo=True,
        )

        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=True)):
            err = IntegrityError("", {}, type("Orig", (), {"__str__": lambda self: "foreign key distrito_id"})())
            with patch.object(service.local_repository, "update", new=AsyncMock(side_effect=err)):
                with patch("app.services.locales.local_service.CacheService.invalidate_lists", new=AsyncMock(return_value=None)):
                    with pytest.raises(BusinessError) as exc:
                        await service.update_local(1, request)
        assert "distrito" in str(exc.value).lower()

    @pytest.mark.asyncio
    async def test_actualizar_falla_tipo_local_no_existe(self, mock_db):
        service = LocalService(db=mock_db)
        request = LocalRequest(
            nombre="Local Editado",
            direccion="Av. Editada",
            distrito_id=10,
            tipo_local_id=999,
            aforo=200,
            activo=True,
        )

        with patch.object(service.tipo_local_repository, "exists", new=AsyncMock(return_value=False)):
            with pytest.raises(BusinessError) as exc:
                await service.update_local(1, request)
        assert exc.value.status_code == 404


class TestDeleteLocal:
    @pytest.mark.asyncio
    async def test_eliminar_exitoso(self, mock_db):
        service = LocalService(db=mock_db)
        with patch("app.services.locales.local_service.CacheService.invalidate_lists", new=AsyncMock(return_value=None)):
            with patch.object(service.local_repository, "delete", new=AsyncMock(return_value=None)):
                result = await service.delete_local(1)

        assert result["success"] is True
        assert "eliminado" in result["message"].lower()


class TestToggleEstado:
    @pytest.mark.asyncio
    async def test_toggle_activar(self, mock_db):
        service = LocalService(db=mock_db)
        with patch.object(service.local_repository, "get_by_id_all", new=AsyncMock(return_value=object())):
            with patch.object(service.local_repository, "update", new=AsyncMock(return_value=None)):
                with patch("app.services.locales.local_service.CacheService.invalidate_lists", new=AsyncMock(return_value=None)):
                    result = await service.toggle_local_status(1, True)

        assert result["success"] is True
        assert result["data"]["activo"] is True

    @pytest.mark.asyncio
    async def test_toggle_desactivar(self, mock_db):
        service = LocalService(db=mock_db)
        with patch.object(service.local_repository, "get_by_id_all", new=AsyncMock(return_value=object())):
            with patch.object(service.local_repository, "update", new=AsyncMock(return_value=None)):
                with patch("app.services.locales.local_service.CacheService.invalidate_lists", new=AsyncMock(return_value=None)):
                    result = await service.toggle_local_status(1, False)

        assert result["success"] is True
        assert result["data"]["activo"] is False

    @pytest.mark.asyncio
    async def test_toggle_no_encontrado(self, mock_db):
        service = LocalService(db=mock_db)
        with patch.object(service.local_repository, "get_by_id_all", new=AsyncMock(return_value=None)):
            with pytest.raises(BusinessError) as exc:
                await service.toggle_local_status(1, True)
        # Nota: el servicio captura cualquier excepción y devuelve 500 actualmente
        assert exc.value.status_code == 500

    @pytest.mark.asyncio
    async def test_toggle_error_generico(self, mock_db):
        service = LocalService(db=mock_db)
        with patch.object(service.local_repository, "get_by_id_all", new=AsyncMock(return_value=object())):
            with patch.object(service.local_repository, "update", new=AsyncMock(side_effect=Exception("boom"))):
                with patch("app.services.locales.local_service.CacheService.invalidate_lists", new=AsyncMock(return_value=None)):
                    with pytest.raises(BusinessError) as exc:
                        await service.toggle_local_status(1, True)
        assert exc.value.status_code == 500


