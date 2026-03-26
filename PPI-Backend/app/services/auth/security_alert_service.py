import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.auth.usuario_repository import UsuarioRepository
from app.utils.email.email_service import send_email
from app.utils.email.templates import suspicious_device_alert_html
from app.core.config import settings
from app.utils.security.user_agent_parser import parse_user_agent
from app.utils.timezone.timezone_helpers import get_location_from_ip, format_datetime_with_timezone

logger = logging.getLogger(__name__)

class SecurityAlertService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.usuario_repo = UsuarioRepository(db)
    
    async def send_suspicious_device_alert_async(
        self,
        user_id: int,
        user_email: str,
        device_info: Dict[str, str]
    ) -> None:
        try:
            utc_now = datetime.now(timezone.utc)
            ip_address = device_info.get("ip", "Desconocido")
            
            location_data = await get_location_from_ip(ip_address)
            
            country = None
            city = None
            timezone_str = None
            offset = None
            
            if location_data:
                country = location_data.get("country")
                city = location_data.get("city")
                timezone_str = location_data.get("timezone")
                offset = location_data.get("offset")
            
            utc_str, local_str = format_datetime_with_timezone(utc_now, timezone_str, offset)
            
            user_agent_raw = device_info.get("user_agent", "Desconocido")
            parsed_info = parse_user_agent(user_agent_raw)
            
            location_display = None
            if city and country:
                location_display = f"{city}, {country}"
            elif country:
                location_display = country
            
            html_body = suspicious_device_alert_html(
                browser=parsed_info["browser"],
                os=parsed_info["os"],
                device=parsed_info["device"],
                device_model=parsed_info.get("device_model"),
                location=location_display,
                timestamp_utc=utc_str,
                timestamp_local=local_str,
                frontend_url=settings.FRONTEND_URL
            )
            
            timestamp_display = local_str if local_str else utc_str
            location_text = f" desde {location_display}" if location_display else ""
            plain_text = f"Nuevo inicio de sesión detectado{location_text} el {timestamp_display}"
            
            await send_email(
                to_email=user_email,
                subject="⚠️ Alerta de Seguridad - Nuevo dispositivo detectado",
                body=html_body,
                plain_text_body=plain_text
            )
            
            logger.info(f"SECURITY | SUSPICIOUS_DEVICE_ALERT | User ID: {user_id} | IP: {device_info.get('ip')} | Email: {user_email}")
        except Exception as e:
            logger.error(f"Error enviando alerta de dispositivo sospechoso para usuario {user_id}: {e}")

