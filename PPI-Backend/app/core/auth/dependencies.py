import logging
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.services.auth.auth_service import AuthService
from app.services.auth.session_service import SessionService
from app.core.config import settings
from app.core.exceptions import AuthenticationError, AuthorizationError, TokenError

logger = logging.getLogger(__name__)
security = HTTPBearer()

session_service = SessionService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise AuthenticationError("No se pudo validar las credenciales")
        
        user_id_int = int(user_id)
        
        token_session_version = payload.get("session_version")
        if token_session_version is not None:
            try:
                current_session_version = await session_service.get_session_version(user_id_int)
                if token_session_version < current_session_version:
                    logger.warning(f"SECURITY | SESSION_INVALIDATED | User ID: {user_id_int} | Token version: {token_session_version} | Current version: {current_session_version}")
                    raise TokenError("Sesión invalidada. Por favor, inicia sesión nuevamente.")
            except TokenError:
                raise
            except Exception as e:
                logger.error(f"Error validando session_version para usuario {user_id_int}: {e}")
        
        auth_service = AuthService(db)
        user = await auth_service.get_user_by_id(user_id_int)
        if user is None:
            raise AuthenticationError("Usuario no encontrado")
        
        if not user.activo:
            raise AuthorizationError("Usuario inactivo")
        
        return user
    except JWTError:
        raise TokenError("Token inválido o expirado")


async def get_current_admin_user(
    current_user = Depends(get_current_user)
):
    if not hasattr(current_user, 'administrador') or not current_user.administrador:
        raise AuthorizationError("No tienes permisos de administrador para acceder a este recurso")
    return current_user


async def get_current_cliente_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> int:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        raise TokenError("Token inválido o expirado")
    
    user_id: str | None = None
    for key in ("cliente_id", "sub", "user_id", "id"):
        if key in payload:
            try:
                user_id = str(payload[key])
                break
            except (TypeError, ValueError):
                continue
    
    if user_id is None:
        raise AuthenticationError("Token sin cliente_id")
    
    user_id_int = int(user_id)
    
    token_session_version = payload.get("session_version")
    if token_session_version is not None:
        try:
            current_session_version = await session_service.get_session_version(user_id_int)
            if token_session_version < current_session_version:
                logger.warning(f"SECURITY | SESSION_INVALIDATED | Cliente ID: {user_id_int} | Token version: {token_session_version} | Current version: {current_session_version}")
                raise TokenError("Sesión invalidada. Por favor, inicia sesión nuevamente.")
        except TokenError:
            raise
        except Exception as e:
            logger.error(f"Error validando session_version para cliente {user_id_int}: {e}")
    
    return user_id_int

