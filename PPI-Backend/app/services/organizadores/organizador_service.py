
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import logging
from app.repositories.organizadores.organizador_repository import OrganizadorRepository
from app.schemas.organizadores.organizador import OrganizadorResponse, OrganizadorCreate, OrganizadorUpdate
from app.utils.handlers.response_handler import ResponseHandler

logger = logging.getLogger(__name__)

class OrganizadorService:
    def __init__(self, db: AsyncSession):
        self.organizador_repository = OrganizadorRepository(db)

    async def get_all_organizadores(self) -> Dict:
        logger.info("Obteniendo lista de todos los organizadores")
        organizadores = await self.organizador_repository.get_all()
        organizadores_response = [OrganizadorResponse.model_validate(org) for org in organizadores]
        return ResponseHandler.success_list(organizadores_response, "Organizadores obtenidos exitosamente")

    async def get_organizador_by_id(self, organizador_id: int) -> Dict:
        logger.info(f"Obteniendo organizador con id {organizador_id}")
        organizador = await self.organizador_repository.get_by_id(organizador_id)
        if not organizador:
            return ResponseHandler.success_response(None, f"Organizador con id {organizador_id} no encontrado")
        organizador_response = OrganizadorResponse.model_validate(organizador)
        return ResponseHandler.success_response(organizador_response, "Organizador obtenido exitosamente")

    async def create_organizador(self, organizador_data: OrganizadorCreate) -> Dict:
        logger.info("Creando nuevo organizador")
        organizador = await self.organizador_repository.create(organizador_data.model_dump())
        organizador_response = OrganizadorResponse.model_validate(organizador)
        return ResponseHandler.success_create(organizador_response)

    async def update_organizador(self, organizador_id: int, organizador_data: OrganizadorUpdate) -> Dict:
        logger.info(f"Actualizando organizador con id {organizador_id}")
        organizador = await self.organizador_repository.update(organizador_id, organizador_data.model_dump(exclude_unset=True))
        if not organizador:
            return ResponseHandler.success_response(None, f"Organizador con id {organizador_id} no encontrado")
        organizador_response = OrganizadorResponse.model_validate(organizador)
        return ResponseHandler.success_update(organizador_response)

    async def delete_organizador(self, organizador_id: int) -> Dict:
        logger.info(f"Eliminando organizador con id {organizador_id}")
        success = await self.organizador_repository.delete(organizador_id)
        if not success:
            return ResponseHandler.success_response(None, f"Organizador con id {organizador_id} no encontrado")
        return ResponseHandler.success_delete()

