"""
Tests unitarios para RegistrationService.

Cubre:
- Validación de tipo de documento (DNI vs CE/Pasaporte)
- Registro de usuarios
- Validación de tokens de registro
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

# Import directo sin pasar por __init__
from app.services.auth.registration_service import RegistrationService
from app.schemas.auth.usuario import UsuarioRegistro
from app.core.exceptions.definitions import BusinessError, TokenError


class TestTipoDocumento:
    """Tests para validación de tipo de documento."""
    
    @pytest.mark.parametrize("numero_documento,expected_tipo_id", [
        ("12345678", 1),           # DNI válido (8 dígitos)
        ("87654321", 1),           # DNI válido (8 dígitos)
        ("00000000", 1),           # DNI válido (8 dígitos)
        ("123456789012", 2),       # CE/Pasaporte válido (12 dígitos)
        ("987654321098", 2),       # CE/Pasaporte válido (12 dígitos)
        ("000000000000", 2),       # CE/Pasaporte válido (12 dígitos)
    ])
    def test_tipo_documento_valido(self, numero_documento, expected_tipo_id):
        """
        Verifica que documentos con longitud válida retornen el tipo correcto.
        
        DNI = 8 dígitos → tipo_documento_id = 1
        CE/Pasaporte = 12 dígitos → tipo_documento_id = 2
        """
        service = RegistrationService(db=None)
        result = service._get_tipo_documento_id(numero_documento)
        assert result == expected_tipo_id
    
    @pytest.mark.parametrize("numero_documento,descripcion", [
        ("", "vacío"),
        ("1", "1 dígito"),
        ("12", "2 dígitos"),
        ("123", "3 dígitos"),
        ("1234", "4 dígitos"),
        ("12345", "5 dígitos"),
        ("123456", "6 dígitos"),
        ("1234567", "7 dígitos"),
        ("123456789", "9 dígitos"),
        ("1234567890", "10 dígitos"),
        ("12345678901", "11 dígitos"),
        ("1234567890123", "13 dígitos"),
        ("12345678901234", "14 dígitos"),
        ("123456789012345", "15 dígitos"),
    ])
    def test_tipo_documento_invalido(self, numero_documento, descripcion):
        """
        Verifica que documentos con longitud inválida lancen BusinessError.
        
        Solo se aceptan 8 dígitos (DNI) o 12 dígitos (CE/Pasaporte).
        """
        service = RegistrationService(db=None)
        
        with pytest.raises(BusinessError) as exc_info:
            service._get_tipo_documento_id(numero_documento)
        
        # Verificar que el mensaje de error contiene "inválido"
        error_message = str(exc_info.value)
        assert "inválido" in error_message.lower() or "invalido" in error_message.lower()
    
    def test_tipo_documento_none(self):
        """
        Verifica que None como documento lance error.
        """
        service = RegistrationService(db=None)
        
        with pytest.raises((BusinessError, AttributeError, TypeError)):
            service._get_tipo_documento_id(None)


class TestRegistrarUsuario:
    """Tests para el método register_usuario."""
    
    @pytest.mark.asyncio
    async def test_registro_exitoso_dni(self, mock_db, valid_registration_data):
        """
        Verifica registro exitoso con DNI (8 dígitos).
        
        Debe:
        - Validar que el usuario no existe
        - Determinar tipo_documento_id = 1
        - Hashear contraseña
        - Generar token aleatorio
        - Guardar en Redis con TTL
        - Retornar link de validación
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        
        # Mock del repositorio
        with patch.object(service.usuario_repository, 'find_by_email_or_document', 
                         return_value=None) as mock_find:
            
            # Mock de Redis
            with patch('app.services.auth.registration_service.redis_client') as mock_redis:
                mock_redis.store_registration_token = AsyncMock(return_value=True)
                
                # Mock de hash_password
                with patch('app.services.auth.registration_service.hash_password',
                          return_value="hashed_password") as mock_hash:
                    
                    # Act
                    usuario_data = UsuarioRegistro(**valid_registration_data)
                    result = await service.register_usuario(usuario_data)
                    
                    # Assert
                    assert result["success"] is True
                    assert "validation_link" in result["data"]
                    assert "email_data" in result
                    assert result["email_data"]["to_email"] == valid_registration_data["email"]
                    
                    # Verificar que se validó unicidad
                    mock_find.assert_called_once()
                    
                    # Verificar que se hasheó la contraseña
                    mock_hash.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_registro_exitoso_ce(self, mock_db):
        """
        Verifica registro exitoso con CE/Pasaporte (12 dígitos).
        
        Debe determinar tipo_documento_id = 2
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        
        usuario_data_ce = UsuarioRegistro(
            email="extranjero@example.com",
            contrasena="SecurePass123!",
            numero_documento="123456789012"  # 12 dígitos
        )
        
        # Mock del repositorio
        with patch.object(service.usuario_repository, 'find_by_email_or_document', 
                         return_value=None):
            
            # Mock de Redis
            with patch('app.services.auth.registration_service.redis_client') as mock_redis:
                mock_redis.store_registration_token = AsyncMock(return_value=True)
                
                # Mock de hash_password
                with patch('app.services.auth.registration_service.hash_password',
                          return_value="hashed_password"):
                    
                    # Act
                    result = await service.register_usuario(usuario_data_ce)
                    
                    # Assert
                    assert result["success"] is True
                    assert "validation_link" in result["data"]
    
    @pytest.mark.asyncio
    async def test_registro_falla_email_duplicado(self, mock_db, valid_registration_data):
        """
        Verifica que falle el registro si el email ya existe.
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        
        # Mock que simula usuario existente
        mock_usuario_existente = MagicMock()
        mock_usuario_existente.email = valid_registration_data["email"]
        
        with patch.object(service.usuario_repository, 'find_by_email_or_document',
                         return_value=mock_usuario_existente):
            
            # Act & Assert
            usuario_data = UsuarioRegistro(**valid_registration_data)
            
            with pytest.raises(BusinessError) as exc_info:
                await service.register_usuario(usuario_data)
            
            assert "ya están registrados" in str(exc_info.value).lower() or \
                   "ya registrado" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_registro_falla_documento_duplicado(self, mock_db):
        """
        Verifica que falle el registro si el documento ya existe.
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        
        usuario_data = UsuarioRegistro(
            email="nuevo@example.com",
            contrasena="SecurePass123!",
            numero_documento="12345678"
        )
        
        # Mock que simula documento existente
        mock_usuario_existente = MagicMock()
        mock_usuario_existente.numero_documento = "12345678"
        
        with patch.object(service.usuario_repository, 'find_by_email_or_document',
                         return_value=mock_usuario_existente):
            
            # Act & Assert
            with pytest.raises(BusinessError) as exc_info:
                await service.register_usuario(usuario_data)
            
            assert "ya están registrados" in str(exc_info.value).lower() or \
                   "ya registrado" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_registro_falla_documento_invalido(self, mock_db):
        """
        Verifica que falle el registro con documento de longitud inválida.
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        
        usuario_data = UsuarioRegistro(
            email="nuevo@example.com",
            contrasena="SecurePass123!",
            numero_documento="123"  # Longitud inválida
        )
        
        with patch.object(service.usuario_repository, 'find_by_email_or_document',
                         return_value=None):
            
            # Act & Assert
            with pytest.raises(BusinessError) as exc_info:
                await service.register_usuario(usuario_data)
            
            assert "inválido" in str(exc_info.value).lower() or \
                   "invalido" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_registro_falla_redis_error(self, mock_db, valid_registration_data):
        """
        Verifica que falle el registro si Redis no puede guardar el token.
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        
        with patch.object(service.usuario_repository, 'find_by_email_or_document',
                         return_value=None):
            
            # Mock de Redis que falla
            with patch('app.services.auth.registration_service.redis_client') as mock_redis:
                mock_redis.store_registration_token = AsyncMock(return_value=False)
                
                with patch('app.services.auth.registration_service.hash_password',
                          return_value="hashed_password"):
                    
                    # Act & Assert
                    usuario_data = UsuarioRegistro(**valid_registration_data)
                    
                    with pytest.raises(BusinessError) as exc_info:
                        await service.register_usuario(usuario_data)
                    
                    assert "token" in str(exc_info.value).lower()


class TestValidarToken:
    """Tests para el método validate_user_token."""
    
    @pytest.mark.asyncio
    async def test_validacion_exitosa(self, mock_db):
        """
        Verifica validación exitosa de token.
        
        Debe:
        - Obtener datos de Redis
        - Crear usuario en BD
        - Crear cliente asociado
        - Eliminar token de Redis
        - Retornar respuesta exitosa con user_id
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        token = "valid_token_12345"
        
        user_data_redis = {
            "email": "nuevo@example.com",
            "numero_documento": "12345678",
            "contrasena": "hashed_password",
            "tipo_documento_id": 1
        }
        
        # Mock de Redis
        with patch('app.services.auth.registration_service.redis_client') as mock_redis:
            mock_redis.get_registration_data = AsyncMock(return_value=user_data_redis)
            mock_redis.delete_registration_token = AsyncMock()
            
            # Mock del repositorio
            with patch.object(service.usuario_repository, 'exists_email',
                             return_value=False):
                
                # Act
                result = await service.validate_user_token(token)
                
                # Assert
                assert result["success"] is True
                assert "user_id" in result["data"]
                
                # Verificar que se eliminó el token
                mock_redis.delete_registration_token.assert_called_once_with(token)
    
    @pytest.mark.asyncio
    async def test_validacion_falla_token_invalido(self, mock_db):
        """
        Verifica que falle la validación con token inválido/expirado.
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        token = "invalid_token"
        
        # Mock de Redis que no encuentra el token
        with patch('app.services.auth.registration_service.redis_client') as mock_redis:
            mock_redis.get_registration_data = AsyncMock(return_value=None)
            
            # Act & Assert
            with pytest.raises(TokenError) as exc_info:
                await service.validate_user_token(token)
            
            assert "inválido" in str(exc_info.value).lower() or \
                   "expirado" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_validacion_falla_usuario_ya_existe(self, mock_db):
        """
        Verifica que maneje el caso de usuario ya registrado (doble validación).
        """
        # Arrange
        service = RegistrationService(db=mock_db)
        token = "valid_token"
        
        user_data_redis = {
            "email": "existente@example.com",
            "numero_documento": "12345678",
            "contrasena": "hashed_password"
        }
        
        # Mock de Redis
        with patch('app.services.auth.registration_service.redis_client') as mock_redis:
            mock_redis.get_registration_data = AsyncMock(return_value=user_data_redis)
            mock_redis.delete_registration_token = AsyncMock()
            
            # Mock que simula que el usuario ya existe
            with patch.object(service.usuario_repository, 'exists_email',
                             return_value=True):
                
                # Act
                result = await service.validate_user_token(token)
                
                # Assert - Debe retornar respuesta de cuenta ya existente
                # (no lanzar error, según el código actual)
                assert "success" in result

