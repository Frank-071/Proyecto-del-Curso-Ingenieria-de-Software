"""
Tests unitarios para PasswordResetService.

Cubre:
- Solicitud de recuperación de contraseña
- Validación de tokens
- Reseteo de contraseña
- Manejo de errores
"""


import pytest
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from app.services.auth.password_reset_service import PasswordResetService
from app.core.exceptions.definitions import BusinessError, TokenError


class TestRequestPasswordReset:
    """Tests para el método request_password_reset."""
    
    @pytest.mark.asyncio
    async def test_solicitud_exitosa(self, mock_db, mock_redis):
        """
        Verifica solicitud exitosa de reset de contraseña.
        
        Debe:
        - Verificar que el email existe
        - Generar token aleatorio
        - Guardar token en Redis con TTL
        - Generar link de reset
        - Retornar datos de email
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        email = "juan.perez@example.com"
        user_id = 1
        
        # Mock del repositorio que retorna user_id
        with patch.object(service.usuario_repo, 'get_id_by_email',
                         return_value=user_id) as mock_get_id:
            
            # Mock de secrets.token_urlsafe
            with patch('app.services.auth.password_reset_service.secrets.token_urlsafe',
                      return_value="fake_reset_token_12345") as mock_token:
                
                # Mock de password_reset_email_html
                with patch('app.services.auth.password_reset_service.password_reset_email_html',
                          return_value="<html>Reset password</html>") as mock_email_html:
                    
                    # Act
                    result = await service.request_password_reset(email)
                    
                    # Assert
                    assert result["success"] is True
                    assert "email_data" in result
                    assert result["email_data"]["to_email"] == email
                    assert result["email_data"]["subject"] == "Restablecer contraseña"
                    assert "reset-pass?token=" in result["email_data"]["plain_text_body"]
                    
                    # Verificar que se llamó a get_id_by_email
                    mock_get_id.assert_called_once_with(email)
                    
                    # Verificar que se generó un token
                    mock_token.assert_called_once()
                    
                    # Verificar que se guardó en Redis
                    mock_redis.setex.assert_called_once()
                    call_args = mock_redis.setex.call_args
                    assert call_args[0][0] == "password_reset:fake_reset_token_12345"
                    assert call_args[0][2] == str(user_id)
    
    @pytest.mark.asyncio
    async def test_solicitud_falla_email_no_existe(self, mock_db, mock_redis):
        """
        Verifica que falle si el email no existe.
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        email = "noexiste@example.com"
        
        # Mock que retorna None (usuario no existe)
        with patch.object(service.usuario_repo, 'get_id_by_email',
                         return_value=None):
            
            # Act & Assert
            with pytest.raises(BusinessError) as exc_info:
                await service.request_password_reset(email)
            
            assert "no existe" in str(exc_info.value).lower() or \
                   "correo" in str(exc_info.value).lower()
            
            # Verificar que NO se guardó en Redis
            mock_redis.setex.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_solicitud_genera_token_aleatorio(self, mock_db, mock_redis):
        """
        Verifica que cada solicitud genera un token diferente.
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        email = "juan.perez@example.com"
        
        with patch.object(service.usuario_repo, 'get_id_by_email',
                         return_value=1):
            
            # Mock de secrets que simula tokens diferentes
            tokens = ["token1", "token2"]
            token_index = [0]
            
            def mock_token_gen(length):
                token = tokens[token_index[0]]
                token_index[0] += 1
                return token
            
            with patch('app.services.auth.password_reset_service.secrets.token_urlsafe',
                      side_effect=mock_token_gen):
                
                with patch('app.services.auth.password_reset_service.password_reset_email_html',
                          return_value="<html>Reset</html>"):
                    
                    # Act - Primera solicitud
                    result1 = await service.request_password_reset(email)
                    
                    # Reset mock
                    mock_redis.setex.reset_mock()
                    
                    # Act - Segunda solicitud
                    result2 = await service.request_password_reset(email)
                    
                    # Assert - Verificar que se usaron tokens diferentes
                    assert "token1" in result1["email_data"]["plain_text_body"]
                    assert "token2" in result2["email_data"]["plain_text_body"]
    
    @pytest.mark.asyncio
    async def test_solicitud_configura_ttl_correcto(self, mock_db, mock_redis):
        """
        Verifica que el token tenga el TTL configurado correctamente.
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        email = "juan.perez@example.com"
        
        with patch.object(service.usuario_repo, 'get_id_by_email',
                         return_value=1):
            
            with patch('app.services.auth.password_reset_service.secrets.token_urlsafe',
                      return_value="test_token"):
                
                with patch('app.services.auth.password_reset_service.password_reset_email_html',
                          return_value="<html>Reset</html>"):
                    
                    # Mock de settings
                    with patch('app.services.auth.password_reset_service.settings') as mock_settings:
                        mock_settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 30
                        mock_settings.FRONTEND_URL = "http://localhost:3000"
                        
                        # Act
                        await service.request_password_reset(email)
                        
                        # Assert - Verificar TTL (30 minutos = 1800 segundos)
                        call_args = mock_redis.setex.call_args
                        ttl_seconds = call_args[0][1]
                        assert ttl_seconds == 30 * 60  # 1800 segundos


class TestResetPassword:
    """Tests para el método reset_password."""
    
    @pytest.mark.asyncio
    async def test_reset_exitoso(self, mock_db, mock_redis):
        """
        Verifica reset exitoso de contraseña.
        
        Debe:
        - Validar token
        - Obtener user_id de Redis
        - Hashear nueva contraseña
        - Actualizar password en BD
        - Eliminar token de Redis
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        token = "valid_reset_token"
        new_password = "NewSecurePass123!"
        user_id = 1
        
        # Mock de Redis que retorna user_id
        mock_redis.get = AsyncMock(return_value=str(user_id))
        
        # Mock del repositorio
        with patch.object(service.usuario_repo, 'update_password',
                         return_value=True) as mock_update:
            
            # Mock de hash_password
            with patch('app.services.auth.password_reset_service.hash_password',
                      return_value="hashed_new_password") as mock_hash:
                
                # Act
                result = await service.reset_password(token, new_password)
                
                # Assert
                assert result["success"] is True
                
                # Verificar que se obtuvo el user_id de Redis
                mock_redis.get.assert_called_once_with(f"password_reset:{token}")
                
                # Verificar que se hasheó la contraseña
                mock_hash.assert_called_once_with(new_password)
                
                # Verificar que se actualizó en BD
                mock_update.assert_called_once_with(user_id, "hashed_new_password")
                
                # Verificar que se eliminó el token
                mock_redis.delete.assert_called_once_with(f"password_reset:{token}")
    
    @pytest.mark.asyncio
    async def test_reset_falla_token_invalido(self, mock_db, mock_redis):
        """
        Verifica que falle con token inválido.
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        token = "invalid_token"
        new_password = "NewPassword123!"
        
        # Mock de Redis que retorna None (token no existe)
        mock_redis.get = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(TokenError) as exc_info:
            await service.reset_password(token, new_password)
        
        assert "inválido" in str(exc_info.value).lower() or \
               "expirado" in str(exc_info.value).lower()
        
        # Verificar que NO se intentó actualizar la BD
        # (no hay llamadas al repositorio)
    
    @pytest.mark.asyncio
    async def test_reset_falla_token_expirado(self, mock_db, mock_redis):
        """
        Verifica que falle con token expirado (Redis retorna None).
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        token = "expired_token"
        new_password = "NewPassword123!"
        
        # Mock de Redis que retorna None (token expiró)
        mock_redis.get = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(TokenError):
            await service.reset_password(token, new_password)
    
    @pytest.mark.asyncio
    async def test_reset_falla_actualizacion_bd(self, mock_db, mock_redis):
        """
        Verifica que falle si no se puede actualizar la contraseña en BD.
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        token = "valid_token"
        new_password = "NewPassword123!"
        
        mock_redis.get = AsyncMock(return_value="1")
        
        # Mock del repositorio que falla
        with patch.object(service.usuario_repo, 'update_password',
                         return_value=False):
            
            with patch('app.services.auth.password_reset_service.hash_password',
                      return_value="hashed_password"):
                
                # Act & Assert
                with pytest.raises(BusinessError) as exc_info:
                    await service.reset_password(token, new_password)
                
                assert "error" in str(exc_info.value).lower() or \
                       "actualizar" in str(exc_info.value).lower()
                
                # Verificar que NO se eliminó el token
                # (porque falló la actualización)
                mock_redis.delete.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_reset_elimina_token_solo_si_exitoso(self, mock_db, mock_redis):
        """
        Verifica que el token solo se elimine si la actualización fue exitosa.
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        token = "valid_token"
        new_password = "NewPassword123!"
        
        mock_redis.get = AsyncMock(return_value="1")
        
        # Caso 1: Actualización exitosa
        with patch.object(service.usuario_repo, 'update_password',
                         return_value=True):
            
            with patch('app.services.auth.password_reset_service.hash_password',
                      return_value="hashed"):
                
                await service.reset_password(token, new_password)
                
                # Verificar que SÍ se eliminó
                mock_redis.delete.assert_called_once()
        
        # Reset mock
        mock_redis.delete.reset_mock()
        
        # Caso 2: Actualización falla
        with patch.object(service.usuario_repo, 'update_password',
                         return_value=False):
            
            with patch('app.services.auth.password_reset_service.hash_password',
                      return_value="hashed"):
                
                with pytest.raises(BusinessError):
                    await service.reset_password(token, new_password)
                
                # Verificar que NO se eliminó
                mock_redis.delete.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_reset_hashea_nueva_password(self, mock_db, mock_redis):
        """
        Verifica que la nueva contraseña se hashee antes de guardarla.
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        token = "valid_token"
        new_password = "PlainTextPassword123"
        
        mock_redis.get = AsyncMock(return_value="1")
        
        with patch.object(service.usuario_repo, 'update_password',
                         return_value=True):
            
            with patch('app.services.auth.password_reset_service.hash_password',
                      return_value="$2b$12$hashed_password") as mock_hash:
                
                # Act
                await service.reset_password(token, new_password)
                
                # Assert - Verificar que se hasheó
                mock_hash.assert_called_once_with(new_password)
                
                # Verificar que se guardó el hash, no el texto plano
                call_args = service.usuario_repo.update_password.call_args
                saved_password = call_args[0][1]
                assert saved_password.startswith("$2b$12$")  # Formato bcrypt
                assert saved_password != new_password  # No es texto plano


class TestIntegracionPasswordReset:
    """Tests de integración del flujo completo."""
    
    @pytest.mark.asyncio
    async def test_flujo_completo_reset_password(self, mock_db, mock_redis):
        """
        Test de integración: flujo completo de recuperación de contraseña.
        
        Simula:
        1. Usuario solicita reset
        2. Recibe token
        3. Usa token para resetear contraseña
        """
        # Arrange
        service = PasswordResetService(db=mock_db)
        service.redis = mock_redis
        email = "juan.perez@example.com"
        user_id = 1
        new_password = "NewSecurePassword123!"
        
        # PASO 1: Solicitar reset
        with patch.object(service.usuario_repo, 'get_id_by_email',
                         return_value=user_id):
            
            with patch('app.services.auth.password_reset_service.secrets.token_urlsafe',
                      return_value="integration_test_token"):
                
                with patch('app.services.auth.password_reset_service.password_reset_email_html',
                          return_value="<html>Reset</html>"):
                    
                    # Act - Solicitud
                    result_request = await service.request_password_reset(email)
                    
                    # Assert - Solicitud exitosa
                    assert result_request["success"] is True
                    assert "integration_test_token" in result_request["email_data"]["plain_text_body"]
        
        # Simular que Redis guardó el token
        mock_redis.get = AsyncMock(return_value=str(user_id))
        
        # PASO 2: Resetear con el token
        with patch.object(service.usuario_repo, 'update_password',
                         return_value=True):
            
            with patch('app.services.auth.password_reset_service.hash_password',
                      return_value="hashed_new_password"):
                
                # Act - Reset
                result_reset = await service.reset_password("integration_test_token", new_password)
                
                # Assert - Reset exitoso
                assert result_reset["success"] is True
                
                # Verificar que se eliminó el token
                mock_redis.delete.assert_called_with("password_reset:integration_test_token")

