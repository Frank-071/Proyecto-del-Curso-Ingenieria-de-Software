import secrets
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.auth.usuario_repository import UsuarioRepository
from app.core.infrastructure import redis_client
from app.core.config import settings
from app.core.exceptions import BusinessError, TokenError
from app.utils.handlers.auth_response_handler import AuthResponseHandler
from app.utils.security.password_helpers import hash_password
from app.utils.email.templates import password_reset_email_html


class PasswordResetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.usuario_repo = UsuarioRepository(db)
        self.redis = redis_client.client

    async def request_password_reset(self, email: str):
        user_id = await self.usuario_repo.get_id_by_email(email)
        if not user_id:
            raise BusinessError("No existe una cuenta con ese correo")
        
        token = secrets.token_urlsafe(32)
        reset_link = f"{settings.FRONTEND_URL}/login/reset-pass?token={token}"
        html_body = password_reset_email_html(reset_link)
        
        await self.redis.setex(
            f"password_reset:{token}",
            settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES * 60,
            str(user_id)
        )
        
        response = AuthResponseHandler.reset_email_sent()
        response["email_data"] = {
            "to_email": email,
            "subject": "Restablecer contraseña",
            "body": html_body,
            "plain_text_body": f"Restablecer contraseña: {reset_link}"
        }
        
        return response

    async def reset_password(self, token: str, new_password: str):
        user_id_str = await self.redis.get(f"password_reset:{token}")
        
        if not user_id_str:
            raise TokenError("Token inválido o expirado")
        
        user_id = int(user_id_str)
        hashed_password = await hash_password(new_password)
        
        updated = await self.usuario_repo.update_password(user_id, hashed_password)
        
        if not updated:
            raise BusinessError("Error al actualizar la contraseña")
        
        await self.redis.delete(f"password_reset:{token}")
        
        return AuthResponseHandler.password_updated()

