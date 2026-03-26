import logging
import secrets
from typing import Dict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.exceptions import BusinessError, TokenError
from app.core.infrastructure import redis_client
from app.repositories.auth.usuario_repository import UsuarioRepository
from app.repositories.auth.cliente_repository import ClienteRepository
from app.schemas.auth.usuario import UsuarioRegistro
from app.utils.handlers.auth_response_handler import AuthResponseHandler
from app.utils.email import registration_email_html
from app.utils.security import hash_password, create_access_token
from app.models import Usuario, Cliente

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

DNI_LENGTH = 8
CE_PASSPORT_LENGTH = 12

class RegistrationService:
    def __init__(self, db: AsyncSession):
        self.usuario_repository = UsuarioRepository(db)
        self.cliente_repository = ClienteRepository(db)

    def _get_tipo_documento_id(self, numero_documento: str) -> int:
        if len(numero_documento) == DNI_LENGTH:
            return 1
        elif len(numero_documento) == CE_PASSPORT_LENGTH:
            return 2
        else:
            raise BusinessError(
                f"Número de documento inválido. Debe tener {DNI_LENGTH} dígitos (DNI) o {CE_PASSPORT_LENGTH} dígitos (CE/Pasaporte)", 
                400
            )

    async def _create_cliente_record(self, usuario_id: int) -> None:
        cliente_dict = {
            "id": usuario_id,
            "rango_id": 1,
            "puntos_disponibles": 0,
            "puntos_historicos": 0,
            "recibir_notificaciones": True
        }
        await self.cliente_repository.create(cliente_dict)

    async def validate_user_token(self, token: str) -> Dict:
        try:
            logger.info(f"Validating token: {token}")
            user_data = await redis_client.get_registration_data(token)
            
            logger.info(f"User data from Redis: {user_data}")
            
            if not user_data:
                logger.error(f"No user data found for token: {token}")
                raise TokenError("Token inválido o expirado")
            
            email = user_data.get("email")
            numero_documento = user_data.get("numero_documento")
            contrasena = user_data.get("contrasena")
            
            if not email:
                raise TokenError("Token inválido o expirado")

            if await self.usuario_repository.exists_email(email):
                await redis_client.delete_registration_token(token)
                return AuthResponseHandler.account_already_exists()

            tipo_documento_id = self._get_tipo_documento_id(numero_documento)

            usuario_dict = {
                "email": email,
                "numero_documento": numero_documento,
                "contrasena": contrasena,
                "tipo_documento_id": tipo_documento_id
            }
            
            db_usuario = Usuario(**usuario_dict)
            self.usuario_repository.db.add(db_usuario)
            await self.usuario_repository.db.flush()
            
            cliente_dict = {
                "id": db_usuario.id,
                "rango_id": 1,
                "puntos_disponibles": 0,
                "puntos_historicos": 0,
                "recibir_notificaciones": True
            }
            db_cliente = Cliente(**cliente_dict)
            self.cliente_repository.db.add(db_cliente)
            
            await self.usuario_repository.db.commit()
            await self.usuario_repository.db.refresh(db_usuario)
            
            await redis_client.delete_registration_token(token)
            
            result = AuthResponseHandler.validation_success(email=email)
            result["data"]["user_id"] = db_usuario.id
            return result

        except SQLAlchemyError as e:
            await self.usuario_repository.db.rollback()
            logger.error(f"Error en validate_user_token (DB): {str(e)}")
            raise TokenError("Error al crear usuario")
        except Exception as e:
            logger.error(f"Error en validate_user_token: {str(e)}")
            raise TokenError("Token inválido o expirado")

    async def register_usuario(self, usuario_data: UsuarioRegistro) -> Dict:
        logger.info(f"Registrando usuario: {usuario_data.email}")
        logger.info(f"Número documento: {usuario_data.numero_documento}")
        
        existing_user = await self.usuario_repository.find_by_email_or_document(
            usuario_data.email, 
            usuario_data.numero_documento
        )
        if existing_user:
            raise BusinessError("Los datos ingresados ya están registrados", 400)

        tipo_documento_id = self._get_tipo_documento_id(usuario_data.numero_documento)
        logger.info(f"Tipo documento ID calculado: {tipo_documento_id}")
        
        usuario_dict = usuario_data.model_dump()
        usuario_dict["contrasena"] = await hash_password(usuario_data.contrasena)
        usuario_dict["tipo_documento_id"] = tipo_documento_id
        
        logger.info(f"Usuario dict antes de Redis: {list(usuario_dict.keys())}")

        token = secrets.token_urlsafe(32)
        ttl_seconds = settings.REGISTRATION_TOKEN_EXPIRE_MINUTES * 60
        
        logger.info(f"Storing token in Redis: {token[:10]}...")
        success = await redis_client.store_registration_token(
            token=token,
            user_data=usuario_dict,
            ttl_seconds=ttl_seconds
        )
        
        logger.info(f"Token storage success: {success}")
        
        if not success:
            raise BusinessError("Error almacenando token de registro. Intenta nuevamente.", 500)

        validation_link = f"{settings.BACKEND_URL}/usuarios/verificar-cuenta?token={token}"

        response = AuthResponseHandler.registration_success(
            email=usuario_data.email,
            validation_link=validation_link
        )
        
        response["email_data"] = {
            "to_email": usuario_data.email,
            "subject": "Valida tu cuenta",
            "body": registration_email_html(validation_link),
            "plain_text_body": f"Hola {usuario_data.email}, valida tu cuenta en este link: {validation_link}"
        }
        
        return response