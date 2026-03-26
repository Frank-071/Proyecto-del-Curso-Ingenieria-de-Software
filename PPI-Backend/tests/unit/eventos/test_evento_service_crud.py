"""
Tests de CRUD y estado para EventoService.
"""

import sys
from pathlib import Path
from types import SimpleNamespace
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta


root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))
sys.modules.setdefault("aiosmtplib", MagicMock())
sys.modules.setdefault("reportlab", MagicMock())
sys.modules.setdefault("reportlab.lib", MagicMock())
sys.modules.setdefault("reportlab.lib.units", SimpleNamespace(inch=72))
sys.modules.setdefault("reportlab.pdfgen", MagicMock())
sys.modules.setdefault("reportlab.pdfgen.canvas", SimpleNamespace(Canvas=MagicMock()))
sys.modules.setdefault("reportlab.lib.utils", SimpleNamespace(ImageReader=MagicMock()))
sys.modules.setdefault(
    "reportlab.lib.colors",
    SimpleNamespace(HexColor=lambda value: value)
)

from app.services.eventos.evento_service import EventoService  # noqa: E402
from app.schemas.eventos import EventoRequest, EventoResponse  # noqa: E402
from app.core.exceptions import BusinessError  # noqa: E402


def build_request(valid: bool = True):
    start = datetime.now() + timedelta(days=1)
    end = datetime.now() + timedelta(days=2)
    if not valid:
        start, end = end, start
    return EventoRequest(
        nombre="Show",
        descripcion="Desc",
        fecha_hora_inicio=start,
        fecha_hora_fin=end,
        local_id=1,
        categoria_evento_id=1,
        organizador_id=1,
        estado="Borrador",
        administrador_id=1,
        icono=None,
        mapa=None,
        es_nominal=False,
    )


class TestGetById:
    @pytest.mark.asyncio
    async def test_get_por_id_ok(self, mock_db):
        service = EventoService(db=mock_db)
        # Construir evento con atributos necesarios para EventoDetailResponse
        ev = MagicMock()
        ev.id = 1
        ev.nombre = "E Detalle"
        ev.descripcion = "Desc"
        ev.estado = "Publicado"
        ev.icono = None
        ev.mapa = None
        ev.fecha_hora_inicio = datetime.now() + timedelta(days=1)
        ev.fecha_hora_fin = datetime.now() + timedelta(days=2)
        # Relaciones anidadas
        distrito = MagicMock()
        provincia = MagicMock()
        departamento = MagicMock()
        departamento.nombre = "Dep"
        provincia.nombre = "Prov"
        provincia.departamento = departamento
        distrito.nombre = "Dist"
        distrito.provincia = provincia
        local = MagicMock()
        local.nombre = "Local Y"
        local.direccion = "Direccion Y"
        local.distrito = distrito
        ev.local = local
        organizador = MagicMock()
        organizador.nombre = "Org"
        ev.organizador = organizador
        categoria = MagicMock()
        categoria.nombre = "Cat"
        ev.categoria_evento = categoria
        ev.zonas = []
        with patch.object(service.evento_repository, "get_by_id_with_zonas_all", new=AsyncMock(return_value=ev)):
            result = await service.get_evento_by_id(1)
        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_get_por_id_no_encontrado(self, mock_db):
        service = EventoService(db=mock_db)
        with patch.object(service.evento_repository, "get_by_id_with_zonas_all", new=AsyncMock(return_value=None)):
            with pytest.raises(BusinessError) as exc:
                await service.get_evento_by_id(999)
        assert exc.value.status_code == 404


class TestCreateUpdateDelete:
    @pytest.mark.asyncio
    async def test_crear_ok(self, mock_db, patch_cache_noop):
        service = EventoService(db=mock_db)
        req = build_request()
        fake = type(
            "Ev",
            (),
            {
                "id": 1,
                "nombre": req.nombre,
                "descripcion": req.descripcion,
                "estado": req.estado,
                "icono": None,
                "mapa": None,
                "banner": None,
                "activo": True,
                "fecha_hora_inicio": req.fecha_hora_inicio,
                "fecha_hora_fin": req.fecha_hora_fin,
                "local_id": req.local_id,
                "categoria_evento_id": req.categoria_evento_id,
                "organizador_id": req.organizador_id,
                "administrador_id": req.administrador_id,
                "es_nominal": req.es_nominal,
            },
        )()
        with patch.object(service.evento_repository, "create", new=AsyncMock(return_value=fake)):
            result = await service.create_evento(req)
        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_crear_valida_fechas(self, mock_db):
        service = EventoService(db=mock_db)
        req = build_request(valid=False)
        with pytest.raises(BusinessError) as exc:
            await service.create_evento(req)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_crear_integrity_mapeos(self, mock_db):
        service = EventoService(db=mock_db)
        req = build_request()
        # Simular distintos mensajes en e.orig
        for msg in (
            "fk_eventos_locales",
            "fk_eventos_categoria",
            "fk_eventos_administrador",
            "violates unique",
        ):
            e = IntegrityError("", {}, type("Orig", (), {"__str__": lambda self, m=msg: m})())
            with patch.object(service.evento_repository, "create", new=AsyncMock(side_effect=e)):
                with pytest.raises(BusinessError):
                    await service.create_evento(req)

        duplicate_msg = "Duplicate entry '1-2025-01-01 10:00:00' for key 'ux_eventos_local_inicio'"
        e_duplicate = IntegrityError(
            "",
            {},
            type("Orig", (), {"__str__": lambda self, m=duplicate_msg: duplicate_msg})()
        )
        with patch.object(service.evento_repository, "create", new=AsyncMock(side_effect=e_duplicate)):
            with pytest.raises(BusinessError) as exc:
                await service.create_evento(req)
        assert exc.value.status_code == 409
        assert "mismo local" in exc.value.message

    @pytest.mark.asyncio
    async def test_update_ok(self, mock_db, patch_cache_noop):
        service = EventoService(db=mock_db)
        req = build_request()
        evento_inicial = type("EvActual", (), {"local_id": req.local_id})()
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(return_value=evento_inicial)):
            fake = type(
                "Ev",
                (),
                {
                    "id": 1,
                    "nombre": req.nombre,
                    "descripcion": req.descripcion,
                    "estado": req.estado,
                    "icono": None,
                    "mapa": None,
                    "banner": None,
                    "activo": True,
                    "fecha_hora_inicio": req.fecha_hora_inicio,
                    "fecha_hora_fin": req.fecha_hora_fin,
                    "local_id": req.local_id,
                    "categoria_evento_id": req.categoria_evento_id,
                    "organizador_id": req.organizador_id,
                    "administrador_id": req.administrador_id,
                    "es_nominal": req.es_nominal,
                    "local": None,
                },
            )()
            with patch.object(service.evento_repository, "update", new=AsyncMock(return_value=fake)):
                with patch.object(service, "_update_notification_jobs", new=AsyncMock(return_value=None)):
                    with patch.object(service, "_notify_event_update", new=AsyncMock(return_value=None)):
                        result = await service.update_evento(1, req)
        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_update_envia_notificacion_cancelacion(self, mock_db, patch_cache_noop):
        service = EventoService(db=mock_db)
        req = build_request()
        req.estado = "cancelado"
        evento_inicial = type("EvActual", (), {"local_id": req.local_id, "estado": "Publicado"})()
        evento_cancelado = type(
            "EvCancel",
            (),
            {
                "id": 1,
                "nombre": req.nombre,
                "descripcion": req.descripcion,
                "estado": "cancelado",
                "icono": None,
                "mapa": None,
                "banner": None,
                "activo": True,
                "fecha_hora_inicio": req.fecha_hora_inicio,
                "fecha_hora_fin": req.fecha_hora_fin,
                "local_id": req.local_id,
                "categoria_evento_id": req.categoria_evento_id,
                "organizador_id": req.organizador_id,
                "administrador_id": req.administrador_id,
                "es_nominal": req.es_nominal,
                "local": None,
            },
        )()
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(return_value=evento_inicial)):
            with patch.object(service.evento_repository, "update", new=AsyncMock(return_value=evento_cancelado)):
                with patch.object(service, "_update_notification_jobs", new=AsyncMock(return_value=None)):
                    with patch.object(service, "_notify_event_cancellation", new=AsyncMock(return_value=None)) as mock_cancel:
                        with patch.object(service, "_notify_event_update", new=AsyncMock(return_value=None)) as mock_update:
                            await service.update_evento(1, req)
        mock_cancel.assert_awaited_once()
        mock_update.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_no_encontrado(self, mock_db):
        service = EventoService(db=mock_db)
        req = build_request()
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(side_effect=ValueError("not found"))):
            with pytest.raises(BusinessError) as exc:
                await service.update_evento(1, req)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_ok(self, mock_db, patch_cache_noop):
        service = EventoService(db=mock_db)
        with patch.object(service.evento_repository, "delete", new=AsyncMock(return_value=None)):
            result = await service.delete_evento(1)
        assert result["success"] is True


class TestEstado:
    @pytest.mark.asyncio
    async def test_update_estado_ok(self, mock_db, patch_cache_noop):
        service = EventoService(db=mock_db)
        evento_mock = type("Ev", (), {"motivo_cancelacion": None})()
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(return_value=evento_mock)):
            with patch.object(service.evento_repository, "update", new=AsyncMock(return_value=evento_mock)):
                result = await service.update_evento_estado(1, "Publicado")
        assert result["success"] is True
        assert result["data"]["estado"] == "Publicado"
        assert result["data"]["motivo_cancelacion"] is None

    @pytest.mark.asyncio
    async def test_update_estado_no_encontrado(self, mock_db):
        service = EventoService(db=mock_db)
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(return_value=None)):
            with pytest.raises(BusinessError) as exc:
                await service.update_evento_estado(1, "Publicado")
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_update_estado_error_generico(self, mock_db):
        service = EventoService(db=mock_db)
        evento_mock = type("Ev", (), {"motivo_cancelacion": None})()
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(return_value=evento_mock)):
            with patch.object(service.evento_repository, "update", new=AsyncMock(side_effect=Exception("boom"))):
                with pytest.raises(BusinessError) as exc:
                    await service.update_evento_estado(1, "Publicado")
        assert exc.value.status_code == 500

    @pytest.mark.asyncio
    async def test_update_estado_cancelado_sin_motivo(self, mock_db):
        service = EventoService(db=mock_db)
        evento_mock = type("Ev", (), {"motivo_cancelacion": None})()
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(return_value=evento_mock)):
            with pytest.raises(BusinessError) as exc:
                await service.update_evento_estado(1, "Cancelado")
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_update_estado_cancelado_con_motivo(self, mock_db, patch_cache_noop):
        service = EventoService(db=mock_db)
        evento_mock = type("Ev", (), {"motivo_cancelacion": "motivo"})()
        with patch.object(service.evento_repository, "get_by_id", new=AsyncMock(return_value=evento_mock)):
            with patch.object(service.evento_repository, "update", new=AsyncMock(return_value=evento_mock)):
                with patch.object(EmailQueueService, "enqueue_cancelacion_evento", new=AsyncMock(return_value=0)):
                    with patch.object(EntradaService, "get_clientes_unicos_evento", new=AsyncMock(return_value=[])):
                        result = await service.update_evento_estado(1, "Cancelado", "motivo")
        assert result["success"] is True
        assert result["data"]["motivo_cancelacion"] == "motivo"


class TestOrganizadorContacto:
    @pytest.mark.asyncio
    async def test_contacto_ok(self, mock_db):
        service = EventoService(db=mock_db)
        organizador = type("Org", (), {"id": 5, "nombre": "Org", "correo": "org@example.com", "telefono": "999"})()
        evento_mock = type("Ev", (), {"organizador": organizador})()
        with patch.object(service.evento_repository, "get_by_id_with_organizador", new=AsyncMock(return_value=evento_mock)):
            result = await service.get_evento_organizador_contacto(1)
        assert result["success"] is True
        assert result["data"]["id"] == 5

    @pytest.mark.asyncio
    async def test_contacto_sin_organizador(self, mock_db):
        service = EventoService(db=mock_db)
        evento_mock = type("Ev", (), {"organizador": None})()
        with patch.object(service.evento_repository, "get_by_id_with_organizador", new=AsyncMock(return_value=evento_mock)):
            result = await service.get_evento_organizador_contacto(1)
        assert result["success"] is True
        assert result.get("data") is None

    @pytest.mark.asyncio
    async def test_contacto_evento_no_encontrado(self, mock_db):
        service = EventoService(db=mock_db)
        with patch.object(service.evento_repository, "get_by_id_with_organizador", new=AsyncMock(return_value=None)):
            with pytest.raises(BusinessError) as exc:
                await service.get_evento_organizador_contacto(1)
        assert exc.value.status_code == 404


class TestWithFiles:
    @pytest.mark.asyncio
    async def test_create_with_files_delega(self, mock_db):
        service = EventoService(db=mock_db)
        req = build_request()
        with patch.object(service.file_service, "create_evento_with_files", new=AsyncMock(return_value={"success": True})):            
            result = await service.create_evento_with_files(req, MagicMock(), None, None)
        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_update_with_files_delega(self, mock_db):
        service = EventoService(db=mock_db)
        req = build_request()
        evento_inicial = type("EvInicial", (), {"local_id": req.local_id})()
        evento_actualizado = type(
            "EvUpd",
            (),
            {
                "id": 1,
                "nombre": req.nombre,
                "descripcion": req.descripcion,
                "estado": req.estado,
                "icono": None,
                "mapa": None,
                "banner": None,
                "activo": True,
                "fecha_hora_inicio": req.fecha_hora_inicio,
                "fecha_hora_fin": req.fecha_hora_fin,
                "local_id": req.local_id,
                "categoria_evento_id": req.categoria_evento_id,
                "organizador_id": req.organizador_id,
                "administrador_id": req.administrador_id,
                "es_nominal": req.es_nominal,
                "local": None,
            },
        )()
        with patch.object(
            service.evento_repository,
            "get_by_id",
            new=AsyncMock(side_effect=[evento_inicial, evento_actualizado])
        ):
            with patch.object(service.file_service, "update_evento_with_files", new=AsyncMock(return_value={"success": True})):
                with patch.object(service, "_update_notification_jobs", new=AsyncMock(return_value=None)):
                    with patch.object(service, "_notify_event_update", new=AsyncMock(return_value=None)):
                        result = await service.update_evento_with_files(1, req, MagicMock(), None, None)
        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_update_with_files_envia_cancelacion(self, mock_db):
        service = EventoService(db=mock_db)
        req = build_request()
        req.estado = "cancelado"
        evento_inicial = type("EvInicial", (), {"local_id": req.local_id, "estado": "Publicado"})()
        evento_actualizado = type(
            "EvUpd",
            (),
            {
                "id": 1,
                "nombre": req.nombre,
                "descripcion": req.descripcion,
                "estado": "cancelado",
                "icono": None,
                "mapa": None,
                "banner": None,
                "activo": True,
                "fecha_hora_inicio": req.fecha_hora_inicio,
                "fecha_hora_fin": req.fecha_hora_fin,
                "local_id": req.local_id,
                "categoria_evento_id": req.categoria_evento_id,
                "organizador_id": req.organizador_id,
                "administrador_id": req.administrador_id,
                "es_nominal": req.es_nominal,
                "local": None,
            },
        )()
        with patch.object(
            service.evento_repository,
            "get_by_id",
            new=AsyncMock(side_effect=[evento_inicial, evento_actualizado])
        ):
            with patch.object(service.file_service, "update_evento_with_files", new=AsyncMock(return_value={"success": True})):
                with patch.object(service, "_update_notification_jobs", new=AsyncMock(return_value=None)):
                    with patch.object(service, "_notify_event_cancellation", new=AsyncMock(return_value=None)) as mock_cancel:
                        with patch.object(service, "_notify_event_update", new=AsyncMock(return_value=None)) as mock_update:
                            result = await service.update_evento_with_files(1, req, MagicMock(), None, None)
        assert result["success"] is True
        mock_cancel.assert_awaited_once()
        mock_update.assert_not_called()


