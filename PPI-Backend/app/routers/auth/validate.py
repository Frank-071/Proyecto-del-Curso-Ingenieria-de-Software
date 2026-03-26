from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from app.services.auth.registration_service import RegistrationService
from app.database.connection import get_db
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.rate_limiting import SimpleRateLimiter, get_client_identifier
import logging

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

validate_token_limiter = SimpleRateLimiter(
    max_requests=5000,
    window_seconds=3600,
    key_prefix="rate_limit:validate_token:ip"
)

def get_usuario_service(db: AsyncSession = Depends(get_db)):
    return RegistrationService(db)

@router.get("/verificar-cuenta")
async def verificar_cuenta(token: str, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        # Rate limiting por IP (consistente con /register)
        ip_identifier = get_client_identifier(request)
        await validate_token_limiter.check_rate_limit(
            ip_identifier,
            custom_error_message="Demasiadas verificaciones desde esta ubicación. Espera 1 hora."
        )
        
        logger.info(f"Validating token: {token}")
        service = RegistrationService(db)
        result = await service.validate_user_token(token)
        
        logger.info(f"Validation result: {result}")
        
        if result.get("success") and result.get("data", {}).get("user_id"):
            user_id = result["data"]["user_id"]
            logger.info(f"Validation successful, redirecting with user_id: {user_id}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login/verificar-cuenta?verified=true&user_id={user_id}")
        else:
            logger.warning(f"Validation failed or missing user_id in result: {result}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login/verificar-cuenta?verified=false")
    except Exception as e:
        logger.error(f"Exception during validation: {str(e)}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login/verificar-cuenta?verified=false")