"""
Tests unitarios para UsuarioService.

Cubre:
- CRUD de usuarios (Create, Read, Update, Delete)
- Validación de usuarios válidos/inválidos
- Manejo de errores
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.exc import SQLAlchemyError

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.auth.usuario_service import UsuarioService
from app.schemas.auth.usuario import UsuarioCreate
from app.core.exceptions.definitions import BusinessError


class TestGetAllUsuarios:
    """Tests para el método get_all_usuarios."""
    
    @pytest.mark.asyncio
    async def test_obtiene_lista_vacia(self, mock_db):
        """
        Verifica que retorna lista vacía cuando no hay usuarios.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        with patch.object(service.usuario_repository, 'get_all_records',
                         return_value=[]):
            
            # Act
            result = await service.get_all_usuarios()
            
            # Assert
            assert result["success"] is True
            assert result["data"] == []
            assert "usuarios obtenidos" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_obtiene_lista_con_usuarios(self, mock_db, mock_usuario_cliente, mock_usuario_admin):
        """
        Verifica que retorna lista de usuarios correctamente.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuarios = [mock_usuario_cliente, mock_usuario_admin]
        
        with patch.object(service.usuario_repository, 'get_all_records',
                         return_value=usuarios):
            
            # Act
            result = await service.get_all_usuarios()
            
            # Assert
            assert result["success"] is True
            assert len(result["data"]) == 2
            # UsuarioResponse son objetos Pydantic, acceder con atributos
            assert result["data"][0].email == "juan.perez@example.com"
            assert result["data"][1].email == "maria.garcia@admin.com"


class TestGetUsuarioById:
    """Tests para el método get_usuario_by_id."""
    
    @pytest.mark.asyncio
    async def test_obtiene_usuario_existente(self, mock_db, mock_usuario_cliente):
        """
        Verifica que obtiene usuario por ID correctamente.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 1
        
        with patch.object(service.usuario_repository, 'get_by_id',
                         return_value=mock_usuario_cliente):
            
            # Act
            result = await service.get_usuario_by_id(usuario_id)
            
            # Assert
            assert result["success"] is True
            # UsuarioResponse es un objeto Pydantic, acceder con atributos
            assert result["data"].id == 1
            assert result["data"].email == "juan.perez@example.com"
    
    @pytest.mark.asyncio
    async def test_falla_usuario_no_existe(self, mock_db):
        """
        Verifica que falle cuando el usuario no existe.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 999
        
        # Mock que retorna None
        with patch.object(service.usuario_repository, 'get_by_id',
                         return_value=None):
            
            # Act & Assert
            # ValidationError porque intenta validar None
            from pydantic_core import ValidationError
            with pytest.raises(ValidationError):
                await service.get_usuario_by_id(usuario_id)


class TestCreateUsuario:
    """Tests para el método create_usuario."""
    
    @pytest.mark.asyncio
    async def test_crea_usuario_exitosamente(self, mock_db):
        """
        Verifica creación exitosa de usuario.
        
        Debe:
        - Hashear contraseña
        - Crear usuario en BD
        - Crear cliente asociado
        - Retornar usuario creado
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Carlos",
            apellidos="Ramírez",
            email="carlos.ramirez@example.com",
            contrasena="SecurePass123!",
            genero="Masculino",
            telefono="987654321",
            numero_documento="12345678"
        )
        
        # Mock de usuario creado con valores reales (no MagicMock)
        mock_usuario_creado = MagicMock()
        mock_usuario_creado.id = 10
        mock_usuario_creado.email = usuario_data.email
        mock_usuario_creado.nombres = usuario_data.nombres
        mock_usuario_creado.apellidos = usuario_data.apellidos
        mock_usuario_creado.tipo_documento_id = usuario_data.tipo_documento_id
        mock_usuario_creado.numero_documento = usuario_data.numero_documento
        mock_usuario_creado.genero = usuario_data.genero
        mock_usuario_creado.telefono = usuario_data.telefono
        mock_usuario_creado.activo = True
        mock_usuario_creado.fecha_creacion = datetime.now()
        mock_usuario_creado.fecha_modificacion = None
        
        # Mocks
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock(side_effect=lambda obj: setattr(obj, 'id', 10) or obj)
        
        with patch('app.services.auth.usuario_service.hash_password',
                  return_value="hashed_password"):
            
            with patch('app.services.auth.usuario_service.Usuario') as MockUsuario:
                MockUsuario.return_value = mock_usuario_creado
                
                with patch('app.services.auth.usuario_service.Cliente'):
                    # Act
                    result = await service.create_usuario(usuario_data)
                    
                    # Assert
                    assert result["success"] is True
                    assert "usuario creado" in result["message"].lower()
                    
                    # Verificar que se llamó flush y commit
                    mock_db.flush.assert_called_once()
                    mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_crea_usuario_con_cliente(self, mock_db):
        """
        Verifica que se crea el registro de cliente asociado.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Ana",
            apellidos="López",
            email="ana.lopez@example.com",
            contrasena="Pass123!",
            numero_documento="87654321"
        )
        
        mock_usuario = MagicMock()
        mock_usuario.id = 20
        mock_usuario.email = usuario_data.email
        mock_usuario.nombres = usuario_data.nombres
        mock_usuario.apellidos = usuario_data.apellidos
        mock_usuario.tipo_documento_id = usuario_data.tipo_documento_id
        mock_usuario.numero_documento = usuario_data.numero_documento
        mock_usuario.genero = None
        mock_usuario.telefono = None
        mock_usuario.activo = True
        mock_usuario.fecha_creacion = datetime.now()
        mock_usuario.fecha_modificacion = None
        
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        
        with patch('app.services.auth.usuario_service.hash_password',
                  return_value="hashed"):
            
            with patch('app.services.auth.usuario_service.Usuario') as MockUsuario:
                MockUsuario.return_value = mock_usuario
                
                with patch('app.services.auth.usuario_service.Cliente'):
                    # Act
                    result = await service.create_usuario(usuario_data)
                    
                    # Assert - Verificar que se agregó cliente
                    # (se verifica en el add del mock_db)
                    assert mock_db.add.call_count == 2  # Usuario + Cliente
    
    @pytest.mark.asyncio
    async def test_falla_contrasena_vacia(self, mock_db):
        """
        Verifica que falle si la contraseña está vacía.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Test",
            apellidos="User",
            email="test@example.com",
            contrasena="",  # Vacía
            numero_documento="12345678"
        )
        
        # Act & Assert
        with pytest.raises(BusinessError) as exc_info:
            await service.create_usuario(usuario_data)
        
        assert "contraseña requerida" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_falla_error_bd(self, mock_db):
        """
        Verifica que maneje errores de base de datos.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Test",
            apellidos="User",
            email="test@example.com",
            contrasena="Pass123!",
            numero_documento="12345678"
        )
        
        # Mock que falla en commit con SQLAlchemyError
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock(side_effect=SQLAlchemyError("DB Error"))
        mock_db.rollback = AsyncMock()
        
        with patch('app.services.auth.usuario_service.hash_password',
                  return_value="hashed"):
            
            # Act & Assert
            with pytest.raises(BusinessError) as exc_info:
                await service.create_usuario(usuario_data)
            
            assert "error al crear usuario" in str(exc_info.value).lower()
            
            # Verificar que se hizo rollback
            mock_db.rollback.assert_called_once()


class TestUpdateUsuario:
    """Tests para el método update_usuario."""
    
    @pytest.mark.asyncio
    async def test_actualiza_usuario_exitosamente(self, mock_db, mock_usuario_cliente):
        """
        Verifica actualización exitosa de usuario.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 1
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Juan Actualizado",
            apellidos="Pérez Updated",
            email="juan.actualizado@example.com",
            contrasena="NewPass123!",
            numero_documento="12345678"
        )
        
        # Mocks
        with patch.object(service.usuario_repository, 'exists',
                         return_value=True):
            
            with patch.object(service.usuario_repository, 'update',
                             return_value=mock_usuario_cliente):
                
                with patch('app.services.auth.usuario_service.hash_password',
                          return_value="new_hashed_password"):
                    
                    # Act
                    result = await service.update_usuario(usuario_id, usuario_data)
                    
                    # Assert
                    assert result["success"] is True
                    assert "actualizado" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_falla_usuario_no_existe(self, mock_db):
        """
        Verifica que falle si el usuario no existe.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 999
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Test",
            apellidos="User",
            email="test@example.com",
            contrasena="Pass123!",
            numero_documento="12345678"
        )
        
        # Mock que indica que no existe
        with patch.object(service.usuario_repository, 'exists',
                         return_value=False):
            
            # Act & Assert
            with pytest.raises(BusinessError) as exc_info:
                await service.update_usuario(usuario_id, usuario_data)
            
            assert "usuario no encontrado" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_hashea_nueva_contrasena(self, mock_db):
        """
        Verifica que hashea la nueva contraseña al actualizar.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 1
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Juan",
            apellidos="Pérez",
            email="juan@example.com",
            contrasena="NewPassword123!",
            numero_documento="12345678"
        )
        
        # Mock con todos los campos necesarios para Pydantic
        mock_usuario_updated = MagicMock()
        mock_usuario_updated.id = usuario_id
        mock_usuario_updated.email = usuario_data.email
        mock_usuario_updated.nombres = usuario_data.nombres
        mock_usuario_updated.apellidos = usuario_data.apellidos
        mock_usuario_updated.tipo_documento_id = usuario_data.tipo_documento_id
        mock_usuario_updated.numero_documento = usuario_data.numero_documento
        mock_usuario_updated.genero = None
        mock_usuario_updated.telefono = None
        mock_usuario_updated.activo = True
        mock_usuario_updated.fecha_creacion = datetime.now()
        mock_usuario_updated.fecha_modificacion = None
        
        with patch.object(service.usuario_repository, 'exists',
                         return_value=True):
            
            with patch.object(service.usuario_repository, 'update',
                             return_value=mock_usuario_updated) as mock_update:
                
                with patch('app.services.auth.usuario_service.hash_password',
                          return_value="$2b$12$newhash") as mock_hash:
                    
                    # Act
                    await service.update_usuario(usuario_id, usuario_data)
                    
                    # Assert - Verificar que se hasheó la contraseña
                    mock_hash.assert_called_once_with("NewPassword123!")
                    
                    # Verificar que se pasó el hash al update
                    call_args = mock_update.call_args[0][1]
                    assert call_args["contrasena"] == "$2b$12$newhash"


class TestDeleteUsuario:
    """Tests para el método delete_usuario."""
    
    @pytest.mark.asyncio
    async def test_elimina_usuario_exitosamente(self, mock_db):
        """
        Verifica eliminación exitosa de usuario.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 1
        
        with patch.object(service.usuario_repository, 'exists',
                         return_value=True):
            
            with patch.object(service.usuario_repository, 'delete',
                             return_value=None) as mock_delete:
                
                # Act
                result = await service.delete_usuario(usuario_id)
                
                # Assert
                assert result["success"] is True
                assert "eliminado" in result["message"].lower()
                mock_delete.assert_called_once_with(usuario_id)
    
    @pytest.mark.asyncio
    async def test_falla_usuario_no_existe(self, mock_db):
        """
        Verifica que falle si intenta eliminar usuario inexistente.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 999
        
        with patch.object(service.usuario_repository, 'exists',
                         return_value=False):
            
            # Act & Assert
            with pytest.raises(BusinessError) as exc_info:
                await service.delete_usuario(usuario_id)
            
            assert "usuario no encontrado" in str(exc_info.value).lower()


class TestValidateUsuarioExists:
    """Tests para el método _validate_usuario_exists."""
    
    @pytest.mark.asyncio
    async def test_valida_usuario_existente(self, mock_db):
        """
        Verifica que no lance error si el usuario existe.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 1
        
        with patch.object(service.usuario_repository, 'exists',
                         return_value=True):
            
            # Act & Assert - No debe lanzar excepción
            await service._validate_usuario_exists(usuario_id)
    
    @pytest.mark.asyncio
    async def test_falla_usuario_no_existe(self, mock_db):
        """
        Verifica que lance error si el usuario no existe.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        usuario_id = 999
        
        with patch.object(service.usuario_repository, 'exists',
                         return_value=False):
            
            # Act & Assert
            with pytest.raises(BusinessError) as exc_info:
                await service._validate_usuario_exists(usuario_id)
            
            assert "usuario no encontrado" in str(exc_info.value).lower()
            assert exc_info.value.status_code == 404


class TestPrepareUsuarioData:
    """Tests para el método _prepare_usuario_data."""
    
    @pytest.mark.asyncio
    async def test_prepara_datos_correctamente(self, mock_db):
        """
        Verifica que prepara los datos del usuario correctamente.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Test",
            apellidos="User",
            email="test@example.com",
            contrasena="Password123!",
            numero_documento="12345678"
        )
        
        with patch('app.services.auth.usuario_service.hash_password',
                  return_value="hashed_password"):
            
            # Act
            result = await service._prepare_usuario_data(usuario_data)
            
            # Assert
            assert result["email"] == "test@example.com"
            assert result["nombres"] == "Test"
            assert result["contrasena"] == "hashed_password"
            assert result["tipo_documento_id"] == 1
    
    @pytest.mark.asyncio
    async def test_falla_sin_contrasena(self, mock_db):
        """
        Verifica que falle si no hay contraseña.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        usuario_data = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Test",
            apellidos="User",
            email="test@example.com",
            contrasena="",  # Vacía
            numero_documento="12345678"
        )
        
        # Act & Assert
        with pytest.raises(BusinessError) as exc_info:
            await service._prepare_usuario_data(usuario_data)
        
        assert "contraseña requerida" in str(exc_info.value).lower()
        assert exc_info.value.status_code == 400


class TestIntegracionCRUD:
    """Tests de integración del flujo CRUD completo."""
    
    @pytest.mark.asyncio
    async def test_flujo_completo_crud(self, mock_db):
        """
        Test de integración: Crear → Leer → Actualizar → Eliminar.
        """
        # Arrange
        service = UsuarioService(db=mock_db)
        
        # PASO 1: Crear usuario
        usuario_data_create = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Integration",
            apellidos="Test",
            email="integration@example.com",
            contrasena="TestPass123!",
            numero_documento="11111111"
        )
        
        mock_usuario_creado = MagicMock()
        mock_usuario_creado.id = 100
        mock_usuario_creado.email = usuario_data_create.email
        mock_usuario_creado.nombres = usuario_data_create.nombres
        mock_usuario_creado.apellidos = usuario_data_create.apellidos
        mock_usuario_creado.tipo_documento_id = usuario_data_create.tipo_documento_id
        mock_usuario_creado.numero_documento = usuario_data_create.numero_documento
        mock_usuario_creado.genero = None
        mock_usuario_creado.telefono = None
        mock_usuario_creado.activo = True
        mock_usuario_creado.fecha_creacion = datetime.now()
        mock_usuario_creado.fecha_modificacion = None
        
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        
        with patch('app.services.auth.usuario_service.hash_password',
                  return_value="hashed"):
            
            with patch('app.services.auth.usuario_service.Usuario') as MockUsuario:
                MockUsuario.return_value = mock_usuario_creado
                
                with patch('app.services.auth.usuario_service.Cliente'):
                    result_create = await service.create_usuario(usuario_data_create)
                    
                    assert result_create["success"] is True
        
        # PASO 2: Leer usuario
        with patch.object(service.usuario_repository, 'get_by_id',
                         return_value=mock_usuario_creado):
            
            result_read = await service.get_usuario_by_id(100)
            
            assert result_read["success"] is True
            assert result_read["data"].email == "integration@example.com"
        
        # PASO 3: Actualizar usuario
        usuario_data_update = UsuarioCreate(
            tipo_documento_id=1,
            nombres="Integration Updated",
            apellidos="Test Updated",
            email="integration.updated@example.com",
            contrasena="NewPass123!",
            numero_documento="11111111"
        )
        
        with patch.object(service.usuario_repository, 'exists',
                         return_value=True):
            
            with patch.object(service.usuario_repository, 'update',
                             return_value=mock_usuario_creado):
                
                with patch('app.services.auth.usuario_service.hash_password',
                          return_value="new_hash"):
                    
                    result_update = await service.update_usuario(100, usuario_data_update)
                    
                    assert result_update["success"] is True
        
        # PASO 4: Eliminar usuario
        with patch.object(service.usuario_repository, 'exists',
                         return_value=True):
            
            with patch.object(service.usuario_repository, 'delete',
                             return_value=None):
                
                result_delete = await service.delete_usuario(100)
                
                assert result_delete["success"] is True
                assert "eliminado" in result_delete["message"].lower()

