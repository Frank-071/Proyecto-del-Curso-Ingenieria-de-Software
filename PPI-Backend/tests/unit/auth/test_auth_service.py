"""
Tests unitarios para AuthService.

Cubre:
- Login de usuarios (cliente y admin)
- Validación de credenciales
- Generación de JWT
- Manejo de roles
- Casos de error
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.auth.auth_service import AuthService
from app.schemas.auth.usuario import UsuarioLogin
from app.core.exceptions.definitions import BusinessError


class TestLoginUsuario:
    """Tests para el método login_usuario."""
    
    @pytest.mark.asyncio
    async def test_login_exitoso_cliente(self, mock_db, mock_usuario_cliente):
        """
        Verifica login exitoso de un cliente.
        
        Debe:
        - Validar credenciales correctas
        - Retornar token JWT
        - Incluir datos del cliente (puntos, rango)
        - Retornar role="cliente"
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        login_data = UsuarioLogin(
            email="juan.perez@example.com",
            contrasena="password123"
        )
        
        # Mock del repositorio que retorna usuario cliente
        with patch.object(service.usuario_repository, 'get_by_email',
                         return_value=mock_usuario_cliente) as mock_get:
            
            # Mock de verify_password que retorna True
            with patch('app.services.auth.auth_service.verify_password',
                      return_value=True) as mock_verify:
                
                # Mock de create_access_token
                with patch('app.services.auth.auth_service.create_access_token',
                          return_value="fake_jwt_token_12345") as mock_create_token:
                    
                    # Act
                    result = await service.login_usuario(login_data)
                    
                    # Assert
                    assert result["success"] is True
                    assert "token" in result["data"]
                    assert result["data"]["token"] == "fake_jwt_token_12345"
                    assert result["data"]["role"] == "cliente"
                    assert result["data"]["user_id"] == 1
                    assert result["data"]["email"] == "juan.perez@example.com"
                    
                    # Verificar datos de cliente
                    assert "puntos_disponibles" in result["data"]
                    assert "puntos_historicos" in result["data"]
                    assert "rango" in result["data"]
                    
                    # Verificar que se llamaron los mocks
                    mock_get.assert_called_once_with(login_data.email)
                    mock_verify.assert_called_once()
                    mock_create_token.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_login_exitoso_admin(self, mock_db, mock_usuario_admin):
        """
        Verifica login exitoso de un administrador.
        
        Debe:
        - Validar credenciales correctas
        - Retornar token JWT
        - Retornar role="admin"
        - Incluir nivel_acceso
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        login_data = UsuarioLogin(
            email="maria.garcia@admin.com",
            contrasena="password123"
        )
        
        with patch.object(service.usuario_repository, 'get_by_email',
                         return_value=mock_usuario_admin):
            
            with patch('app.services.auth.auth_service.verify_password',
                      return_value=True):
                
                with patch('app.services.auth.auth_service.create_access_token',
                          return_value="fake_admin_token"):
                    
                    # Act
                    result = await service.login_usuario(login_data)
                    
                    # Assert
                    assert result["success"] is True
                    assert result["data"]["token"] == "fake_admin_token"
                    assert result["data"]["role"] == "admin"
                    assert result["data"]["admin_type"] == "superadmin"
                    assert result["data"]["user_id"] == 2
    
    @pytest.mark.asyncio
    async def test_login_falla_email_no_existe(self, mock_db):
        """
        Verifica que falle el login si el email no existe.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        login_data = UsuarioLogin(
            email="noexiste@example.com",
            contrasena="password123"
        )
        
        # Mock que retorna None (usuario no encontrado)
        with patch.object(service.usuario_repository, 'get_by_email',
                         return_value=None):
            
            # Act
            result = await service.login_usuario(login_data)
            
            # Assert
            assert result["success"] is False
            assert "credenciales" in result["message"].lower() or \
                   "inválidas" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_login_falla_password_incorrecta(self, mock_db, mock_usuario_cliente):
        """
        Verifica que falle el login con contraseña incorrecta.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        login_data = UsuarioLogin(
            email="juan.perez@example.com",
            contrasena="wrongpassword"
        )
        
        with patch.object(service.usuario_repository, 'get_by_email',
                         return_value=mock_usuario_cliente):
            
            # Mock de verify_password que retorna False
            with patch('app.services.auth.auth_service.verify_password',
                      return_value=False):
                
                # Act
                result = await service.login_usuario(login_data)
                
                # Assert
                assert result["success"] is False
                assert "credenciales" in result["message"].lower() or \
                       "inválidas" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_login_usuario_inactivo(self, mock_db, mock_usuario_inactivo):
        """
        Verifica que un usuario inactivo puede intentar login.
        
        Nota: El servicio actual no valida activo=False, 
        esto es un caso edge a considerar en futuras mejoras.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        login_data = UsuarioLogin(
            email="pedro.lopez@example.com",
            contrasena="password123"
        )
        
        with patch.object(service.usuario_repository, 'get_by_email',
                         return_value=mock_usuario_inactivo):
            
            with patch('app.services.auth.auth_service.verify_password',
                      return_value=True):
                
                with patch('app.services.auth.auth_service.create_access_token',
                          return_value="token_inactivo"):
                    
                    # Act
                    result = await service.login_usuario(login_data)
                    
                    # Assert - Actualmente permite login de usuarios inactivos
                    # Este test documenta el comportamiento actual
                    assert result["success"] is True
                    # TODO: Considerar agregar validación de usuario activo


class TestGetUserRoleFromObj:
    """Tests para el método _get_user_role_from_obj."""
    
    @pytest.mark.asyncio
    async def test_obtiene_rol_cliente(self, mock_db, mock_usuario_cliente):
        """
        Verifica que retorna rol 'cliente' correctamente.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        # Act
        role, admin_type = await service._get_user_role_from_obj(mock_usuario_cliente)
        
        # Assert
        assert role == "cliente"
        assert admin_type is None
    
    @pytest.mark.asyncio
    async def test_obtiene_rol_admin(self, mock_db, mock_usuario_admin):
        """
        Verifica que retorna rol 'admin' con nivel de acceso.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        # Act
        role, admin_type = await service._get_user_role_from_obj(mock_usuario_admin)
        
        # Assert
        assert role == "admin"
        assert admin_type == "superadmin"
    
    @pytest.mark.asyncio
    async def test_usuario_sin_rol_crea_cliente(self, mock_db):
        """
        Verifica que si un usuario no tiene rol, se crea como cliente automáticamente.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        # Usuario sin cliente ni administrador
        usuario_sin_rol = MagicMock()
        usuario_sin_rol.id = 99
        usuario_sin_rol.cliente = None
        usuario_sin_rol.administrador = None
        
        # Mock del método create del repositorio
        with patch.object(service.cliente_repository, 'create',
                         return_value=None) as mock_create:
            
            # Act
            role, admin_type = await service._get_user_role_from_obj(usuario_sin_rol)
            
            # Assert
            assert role == "cliente"
            assert admin_type is None
            
            # Verificar que se creó el cliente
            mock_create.assert_called_once()
            call_args = mock_create.call_args[0][0]
            assert call_args["id"] == 99
            assert call_args["rango_id"] == 1
            assert call_args["puntos_disponibles"] == 0


class TestGenerateLoginResponse:
    """Tests para el método _generate_login_response."""
    
    @pytest.mark.asyncio
    async def test_genera_respuesta_cliente_con_rango(self, mock_db, mock_usuario_cliente):
        """
        Verifica que genera respuesta correcta para cliente con rango.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        # Mock de rango
        mock_rango = MagicMock()
        mock_rango.nombre = "ORO"
        mock_rango.porcentaje_descuento = 10.5
        mock_usuario_cliente.cliente.rango = mock_rango
        
        with patch('app.services.auth.auth_service.create_access_token',
                  return_value="jwt_token_con_rango"):
            
            # Act
            result = await service._generate_login_response(mock_usuario_cliente)
            
            # Assert
            assert result["success"] is True
            assert result["data"]["token"] == "jwt_token_con_rango"
            assert result["data"]["role"] == "cliente"
            assert result["data"]["rango"] == "oro"  # lowercase
            assert result["data"]["porcentaje_descuento"] == 10.5
            assert result["data"]["puntos_disponibles"] == 100
            assert result["data"]["puntos_historicos"] == 500
    
    @pytest.mark.asyncio
    async def test_genera_respuesta_cliente_sin_rango(self, mock_db, mock_usuario_cliente):
        """
        Verifica que usa valores por defecto si el cliente no tiene rango.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        # Cliente sin rango
        mock_usuario_cliente.cliente.rango = None
        
        with patch('app.services.auth.auth_service.create_access_token',
                  return_value="jwt_token_sin_rango"):
            
            # Act
            result = await service._generate_login_response(mock_usuario_cliente)
            
            # Assert
            assert result["data"]["rango"] == "bronce"  # Valor por defecto
            assert result["data"]["porcentaje_descuento"] == 0.0
    
    @pytest.mark.asyncio
    async def test_genera_respuesta_admin(self, mock_db, mock_usuario_admin):
        """
        Verifica que genera respuesta correcta para admin (sin datos de cliente).
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        with patch('app.services.auth.auth_service.create_access_token',
                  return_value="jwt_admin_token"):
            
            # Act
            result = await service._generate_login_response(mock_usuario_admin)
            
            # Assert
            assert result["success"] is True
            assert result["data"]["role"] == "admin"
            assert result["data"]["admin_type"] == "superadmin"
            # No debe incluir datos de cliente
            assert "puntos_disponibles" not in result["data"] or \
                   result["data"].get("puntos_disponibles") is None


class TestLoginAfterVerification:
    """Tests para el método login_after_verification."""
    
    @pytest.mark.asyncio
    async def test_login_despues_verificacion_exitoso(self, mock_db, mock_usuario_cliente):
        """
        Verifica login automático después de verificar email.
        """
        # Arrange
        service = AuthService(db=mock_db)
        user_id = 1
        
        with patch.object(service.usuario_repository, 'get_by_id',
                         return_value=mock_usuario_cliente):
            
            with patch('app.services.auth.auth_service.create_access_token',
                      return_value="jwt_after_verification"):
                
                # Act
                result = await service.login_after_verification(user_id)
                
                # Assert
                assert result["success"] is True
                assert result["data"]["token"] == "jwt_after_verification"
                assert result["data"]["user_id"] == 1
    
    @pytest.mark.asyncio
    async def test_login_despues_verificacion_usuario_no_existe(self, mock_db):
        """
        Verifica que falle si el usuario no existe.
        """
        # Arrange
        service = AuthService(db=mock_db)
        user_id = 999
        
        with patch.object(service.usuario_repository, 'get_by_id',
                         return_value=None):
            
            # Act
            result = await service.login_after_verification(user_id)
            
            # Assert
            assert result["success"] is False
            assert "usuario no encontrado" in result["message"].lower()


class TestGetUserById:
    """Tests para el método get_user_by_id."""
    
    @pytest.mark.asyncio
    async def test_obtiene_usuario_por_id(self, mock_db, mock_usuario_cliente):
        """
        Verifica que obtiene usuario correctamente por ID.
        """
        # Arrange
        service = AuthService(db=mock_db)
        user_id = 1
        
        with patch.object(service.usuario_repository, 'get_by_id',
                         return_value=mock_usuario_cliente) as mock_get:
            
            # Act
            result = await service.get_user_by_id(user_id)
            
            # Assert
            assert result is not None
            assert result.id == 1
            assert result.email == "juan.perez@example.com"
            mock_get.assert_called_once_with(user_id)
    
    @pytest.mark.asyncio
    async def test_obtiene_usuario_no_existente(self, mock_db):
        """
        Verifica que retorna None si el usuario no existe.
        """
        # Arrange
        service = AuthService(db=mock_db)
        user_id = 999
        
        with patch.object(service.usuario_repository, 'get_by_id',
                         return_value=None):
            
            # Act
            result = await service.get_user_by_id(user_id)
            
            # Assert
            assert result is None


class TestIntegracionLogin:
    """Tests de integración entre métodos del servicio."""
    
    @pytest.mark.asyncio
    async def test_flujo_completo_login_cliente(self, mock_db, mock_usuario_cliente):
        """
        Test de integración: flujo completo de login de cliente.
        
        Simula el flujo real desde login_usuario hasta generación de JWT.
        """
        # Arrange
        service = AuthService(db=mock_db)
        
        login_data = UsuarioLogin(
            email="juan.perez@example.com",
            contrasena="password123"
        )
        
        with patch.object(service.usuario_repository, 'get_by_email',
                         return_value=mock_usuario_cliente):
            
            with patch('app.services.auth.auth_service.verify_password',
                      return_value=True):
                
                with patch('app.services.auth.auth_service.create_access_token',
                          return_value="integration_test_token"):
                    
                    # Act - Llamada única que desencadena todo el flujo
                    result = await service.login_usuario(login_data)
                    
                    # Assert - Verificar respuesta completa
                    assert result["success"] is True
                    assert result["data"]["token"] == "integration_test_token"
                    assert result["data"]["role"] == "cliente"
                    assert result["data"]["user_id"] == mock_usuario_cliente.id
                    assert result["data"]["email"] == mock_usuario_cliente.email
                    
                    # Verificar datos de cliente incluidos
                    assert "puntos_disponibles" in result["data"]
                    assert "puntos_historicos" in result["data"]
                    assert "rango" in result["data"]
                    assert "porcentaje_descuento" in result["data"]

