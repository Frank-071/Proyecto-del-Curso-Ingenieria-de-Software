from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.schemas.auth.usuario import UsuarioLogin, UserIdRequest
from app.services.auth.auth_service import AuthService
from app.services.auth.session_service import SessionService
from app.database.connection import get_db
from app.core.rate_limiting import SimpleRateLimiter, get_client_identifier
from app.core.auth.dependencies import get_current_user
from app.utils.handlers.auth_response_handler import AuthResponseHandler
from app.models.auth.usuario import Usuario

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

login_email_limiter = SimpleRateLimiter(
    max_requests=5,
    window_seconds=900,
    key_prefix="rate_limit:login:email"
)

session_service = SessionService()

@router.post("/login")
async def login_usuario(
    login_data: UsuarioLogin,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Dict:
    email_identifier = get_client_identifier(request, login_data.email)
    await login_email_limiter.check_rate_limit(
        email_identifier,
        custom_error_message="Demasiados intentos de login. Espera 15 minutos."
    )
    
    service = AuthService(db)
    return await service.login_usuario(login_data, request)

@router.post("/login-after-verification")
async def login_after_verification(
    user_request: UserIdRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Dict:
    service = AuthService(db)
    return await service.login_after_verification(user_request.user_id, request)

@router.post("/cerrar-todas-sesiones")
async def cerrar_todas_sesiones(
    current_user: Usuario = Depends(get_current_user)
) -> Dict:
    await session_service.invalidate_all_sessions(current_user.id)
    return AuthResponseHandler.sessions_invalidated()