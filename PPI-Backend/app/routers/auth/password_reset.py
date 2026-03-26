from fastapi import APIRouter, Depends, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from app.database.connection import get_db
from app.services.auth.password_reset_service import PasswordResetService
from app.schemas.auth.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.utils.email import send_email
from app.core.rate_limiting import SimpleRateLimiter, get_client_identifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

forgot_password_email_limiter = SimpleRateLimiter(
    max_requests=3,
    window_seconds=3600,
    key_prefix="rate_limit:forgot_password:email"
)

forgot_password_ip_limiter = SimpleRateLimiter(
    max_requests=100,
    window_seconds=3600,
    key_prefix="rate_limit:forgot_password:ip"
)

reset_password_ip_limiter = SimpleRateLimiter(
    max_requests=100,
    window_seconds=3600,
    key_prefix="rate_limit:reset_password:ip"
)

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Rate limiting por IP (protección anti-flood)
    ip_identifier = get_client_identifier(http_request)
    await forgot_password_ip_limiter.check_rate_limit(
        ip_identifier,
        custom_error_message="Demasiadas solicitudes de recuperación desde esta ubicación. Espera 1 hora."
    )
    
    # Rate limiting por email (protección principal)
    email_identifier = get_client_identifier(http_request, request.email)
    await forgot_password_email_limiter.check_rate_limit(
        email_identifier,
        custom_error_message="Demasiados intentos de recuperación. Espera 1 hora."
    )
    
    service = PasswordResetService(db)
    result = await service.request_password_reset(request.email)
    
    if "email_data" in result:
        email_data = result.pop("email_data")
        
        async def enviar_correo_background():
            try:
                await send_email(
                    to_email=email_data["to_email"],
                    subject=email_data["subject"],
                    body=email_data["body"],
                    plain_text_body=email_data["plain_text_body"]
                )
            except Exception as e:
                # En background tasks, NO lanzar excepciones para evitar "response already started"
                logger.error(f"Error enviando correo de recuperación a {email_data['to_email']}: {str(e)}", exc_info=True)
        
        background_tasks.add_task(enviar_correo_background)
    
    return result

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Rate limiting por IP (consistente con forgot-password)
    ip_identifier = get_client_identifier(http_request)
    await reset_password_ip_limiter.check_rate_limit(
        ip_identifier,
        custom_error_message="Demasiados intentos de cambio de contraseña desde esta ubicación. Espera 1 hora."
    )
    
    service = PasswordResetService(db)
    return await service.reset_password(request.token, request.new_password)

