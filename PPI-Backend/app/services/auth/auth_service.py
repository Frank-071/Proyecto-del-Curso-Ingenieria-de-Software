import logging
import uuid
import asyncio
from typing import Dict
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.auth import UsuarioRepository, ClienteRepository, AdministradorRepository
from app.schemas.auth.usuario import UsuarioLogin
from app.utils.handlers.auth_response_handler import AuthResponseHandler
from app.utils.security import create_access_token, verify_password, extract_device_info
from app.services.auth.session_service import SessionService
from app.services.auth.security_alert_service import SecurityAlertService

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: AsyncSession):
        self.usuario_repository = UsuarioRepository(db)
        self.cliente_repository = ClienteRepository(db)
        self.administrador_repository = AdministradorRepository(db)
        self.session_service = SessionService()
        self.security_alert_service = SecurityAlertService(db)

    async def get_user_by_id(self, user_id: int):
        return await self.usuario_repository.get_by_id(user_id)
    

    async def _get_user_role_from_obj(self, usuario) -> tuple[str, str]:
        if usuario.administrador:
            return ("admin", usuario.administrador.nivel_acceso)
        if usuario.cliente:
            return ("cliente", None)
        logger.warning(f"Usuario {usuario.id} no tenía rol asignado, creando como cliente")
        cliente_dict = {
            "id": usuario.id,
            "rango_id": 1,
            "puntos_disponibles": 0,
            "puntos_historicos": 0,
            "recibir_notificaciones": True
        }
        await self.cliente_repository.create(cliente_dict)
        return ("cliente", None)

    async def login_usuario(self, login_data: UsuarioLogin, request: Request) -> Dict:
        usuario = await self.usuario_repository.get_by_email(login_data.email)
        if not usuario:
            logger.warning(f"SECURITY | LOGIN_FAILED | Email: {login_data.email} | Reason: User not found")
            return AuthResponseHandler.login_failed("Credenciales inválidas")
        if not await verify_password(login_data.contrasena, usuario.contrasena):
            logger.warning(f"SECURITY | LOGIN_FAILED | Email: {login_data.email} | Reason: Invalid password")
            return AuthResponseHandler.login_failed("Credenciales inválidas")

        logger.info(f"SECURITY | LOGIN_SUCCESS | User ID: {usuario.id} | Email: {usuario.email}")
        return await self._generate_login_response(usuario, request)
    
    async def _generate_login_response(self, usuario, request: Request) -> Dict:
        role, admin_type = await self._get_user_role_from_obj(usuario)
        
        cliente_data = {}
        if role == "cliente":
            rango = usuario.cliente.rango
            rango_nombre = rango.nombre.lower() if rango else "bronce"
            porcentaje_descuento = float(rango.porcentaje_descuento) if rango else 0.0
            
            cliente_data = {
                "puntos_disponibles": usuario.cliente.puntos_disponibles or 0,
                "puntos_historicos": usuario.cliente.puntos_historicos or 0,
                "rango": rango_nombre,
                "porcentaje_descuento": porcentaje_descuento
            }
        
        try:
            device_info = extract_device_info(request)
            session_version, known_devices = await self.session_service.get_session_data(usuario.id)
            
            logger.info(f"SECURITY | LOGIN_DEVICE_INFO | User ID: {usuario.id} | Session Version: {session_version} | Known Devices Count: {len(known_devices)} | IP: {device_info.get('ip')}")
            
            device_hash = device_info["device_hash"]
            is_suspicious = await self.session_service.is_suspicious_device(
                usuario.id,
                device_hash,
                device_info,
                known_devices
            )
            
            logger.info(f"SECURITY | DEVICE_CHECK | User ID: {usuario.id} | Device Hash: {device_hash[:16]}... | Is Suspicious: {is_suspicious}")
            
            jti = str(uuid.uuid4())
            
            await self.session_service.save_known_device(
                usuario.id,
                device_hash,
                device_info,
                session_version
            )
            
            logger.info(f"SECURITY | DEVICE_SAVED | User ID: {usuario.id} | Device Hash: {device_hash[:16]}... | Session Version: {session_version}")
            
            if is_suspicious:
                user_email = usuario.email
                asyncio.create_task(
                    self.security_alert_service.send_suspicious_device_alert_async(
                        user_id=usuario.id,
                        user_email=user_email,
                        device_info=device_info
                    )
                )
                logger.warning(f"SECURITY | SUSPICIOUS_DEVICE | User ID: {usuario.id} | IP: {device_info.get('ip')} | Device Hash: {device_hash[:16]}...")
        except Exception as e:
            logger.error(f"Error procesando información de dispositivo para usuario {usuario.id}: {e}")
            session_version = 1
            jti = str(uuid.uuid4())
        
        token = create_access_token(
            user_id=usuario.id,
            email=usuario.email,
            role=role,
            admin_type=admin_type,
            session_version=session_version,
            jti=jti,
            fecha_creacion=usuario.fecha_creacion.isoformat()
        )
        
        return AuthResponseHandler.login_success(
            token=token,
            user_id=usuario.id,
            email=usuario.email,
            role=role,
            admin_type=admin_type,
            cliente_data=cliente_data
        )
    
    async def login_after_verification(self, user_id: int, request: Request) -> Dict:
        usuario = await self.usuario_repository.get_by_id(user_id)
        if not usuario:
            return AuthResponseHandler.login_failed("Usuario no encontrado")

        return await self._generate_login_response(usuario, request)