from fastapi import APIRouter, Depends, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import logging
from app.schemas.auth.usuario import UsuarioRegistro
from app.services.auth.registration_service import RegistrationService
from app.database.connection import get_db, AsyncSessionLocal
from app.utils.email import send_email
from app.core.rate_limiting import SimpleRateLimiter, get_client_identifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

register_ip_limiter = SimpleRateLimiter(
    max_requests=5000,
    window_seconds=3600,
    key_prefix="rate_limit:register:ip"
)

register_email_limiter = SimpleRateLimiter(
    max_requests=3,
    window_seconds=3600,
    key_prefix="rate_limit:register:email"
)


@router.post("/register", status_code=201)
async def register_user(
    user_data: UsuarioRegistro,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip_identifier = get_client_identifier(request)
    await register_ip_limiter.check_rate_limit(
        ip_identifier,
        custom_error_message="Demasiados registros desde esta ubicación. Espera 1 hora."
    )
    
    email_identifier = get_client_identifier(request, user_data.email)
    await register_email_limiter.check_rate_limit(
        email_identifier,
        custom_error_message="Este email ya intentó registrarse recientemente. Espera 1 hora."
    )
    
    service = RegistrationService(db)
    result = await service.register_usuario(user_data)
    
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
                logger.error(f"Error enviando correo de registro a {email_data['to_email']}: {str(e)}", exc_info=True)
        
        background_tasks.add_task(enviar_correo_background)
    
    return result

validate_token_limiter = SimpleRateLimiter(
    max_requests=5000,
    window_seconds=3600,
    key_prefix="rate_limit:validate_token:ip"
)

@router.get("/validate/{token}")
async def validate_user_token(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Rate limiting por IP (consistente con /register)
    ip_identifier = get_client_identifier(request)
    await validate_token_limiter.check_rate_limit(
        ip_identifier,
        custom_error_message="Demasiadas verificaciones desde esta ubicación. Espera 1 hora."
    )
    
    service = RegistrationService(db)
    return await service.validate_user_token(token)
