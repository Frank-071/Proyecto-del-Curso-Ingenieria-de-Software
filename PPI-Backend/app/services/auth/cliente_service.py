import logging
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.auth.cliente_repository import ClienteRepository
from app.schemas.auth.usuario import UsuarioResponse
from app.services.eventos.entrada_service import EntradaService
from app.services.shared import CacheService
from app.utils.handlers import ResponseHandler
from app.core.config import settings

logger = logging.getLogger(__name__)


class ClienteService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cliente_repository = ClienteRepository(db)
    
    async def get_perfil_completo(self, current_user, usuario_id: int) -> Dict:
        """
        Obtiene el perfil completo del cliente con cache Redis.
        Incluye: datos básicos, puntos, tickets y próximo evento.
        """
        cache_key = f"cliente:perfil:{usuario_id}"
        tag_key = "cache_tags:clientes"
        
        async def fetch():
            # Obtener datos básicos del usuario
            user_data = UsuarioResponse.model_validate(current_user)
            
            # Obtener datos del cliente (incluyendo puntos)
            cliente = await self.cliente_repository.get_by_id(usuario_id)
            
            # Obtener resumen de entradas
            entrada_service = EntradaService(self.db)
            resumen_entradas = await entrada_service.get_cliente_ticket_summary(usuario_id)
            
            # Combinar datos del usuario y cliente
            perfil_completo = {
                **user_data.model_dump(),
                "puntos_disponibles": cliente.puntos_disponibles if cliente else 0,
                "puntos_historicos": cliente.puntos_historicos if cliente else 0,
                "rango_id": cliente.rango_id if cliente else None,
                "imagen_perfil": cliente.imagen_perfil if cliente else None,
                "recibir_notificaciones": cliente.recibir_notificaciones if cliente else True,
                **resumen_entradas,
            }
            
            return ResponseHandler.success_response(perfil_completo, "Perfil obtenido exitosamente")
        
        return await CacheService.get_or_fetch(
            cache_key=cache_key,
            tag_key=tag_key,
            fetch_fn=fetch,
            ttl=settings.CACHE_TTL_USER_PROFILE
        )

