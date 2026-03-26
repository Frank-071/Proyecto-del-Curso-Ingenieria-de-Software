from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional
from decimal import Decimal
import logging

from app.repositories.promociones import PromocionRepository
from app.schemas.promociones import (
    PromocionCreateRequest,
    PromocionUpdateRequest,
    PromocionResponse,
)
from app.utils.handlers.response_handler import ResponseHandler
from app.core.exceptions import BusinessError


logger = logging.getLogger(__name__)


class PromocionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.promocion_repository = PromocionRepository(db)

    async def get_all_promociones(
        self, skip: int = 0, limit: int = 50, activo: Optional[bool] = True
    ) -> Dict:
        promocions = await self.promocion_repository.get_all_filtered(
            skip=skip, limit=limit, activo=activo
        )
        items = [PromocionResponse.model_validate(p).model_dump() for p in promocions]
        return ResponseHandler.success_list(items, "Promociones obtenidas exitosamente")

    async def get_promocion_by_id(self, promocion_id: int) -> Dict:
        try:
            promocion = await self.promocion_repository.get_by_id(promocion_id)
            data = PromocionResponse.model_validate(promocion).model_dump()
            return ResponseHandler.success(data, "Promocion obtenida exitosamente")
        except ValueError:
            raise BusinessError(
                f"Promocion con ID {promocion_id} no encontrada", 404
            )

    async def create_promocion(self, promocion_data: PromocionCreateRequest) -> Dict:
        # Validaciones simples
        if promocion_data.fecha_inicio and promocion_data.fecha_fin:
            if promocion_data.fecha_fin < promocion_data.fecha_inicio:
                raise BusinessError(
                    "fecha_fin debe ser posterior a fecha_inicio", 400
                )

        # Porcentaje vacio -> 0
        porcentaje = (
            Decimal("0")
            if promocion_data.porcentaje_promocion is None
            else promocion_data.porcentaje_promocion
        )
        if porcentaje < 0 or porcentaje > 100:
            raise BusinessError("porcentaje_promocion debe estar entre 0 y 100", 400)

        try:
            payload = promocion_data.model_dump()
            payload["porcentaje_promocion"] = porcentaje

            created = await self.promocion_repository.create(payload)
            response = PromocionResponse.model_validate(created).model_dump()
            return ResponseHandler.success_create(
                response, "Promocion creada exitosamente"
            )
        except Exception as e:
            logger.error(f"Error creando promocion: {e}")
            raise BusinessError("Error interno creando la promocion", 500)

    async def update_promocion(
        self, promocion_id: int, promocion_data: PromocionUpdateRequest
    ) -> Dict:
        # Validate date range if present
        if promocion_data.fecha_inicio and promocion_data.fecha_fin:
            if promocion_data.fecha_fin < promocion_data.fecha_inicio:
                raise BusinessError(
                    "fecha_fin debe ser posterior a fecha_inicio", 400
                )

        try:
            updated = await self.promocion_repository.update(
                promocion_id, promocion_data.model_dump(exclude_none=True)
            )
            response = PromocionResponse.model_validate(updated).model_dump()
            return ResponseHandler.success_update(
                response, "Promocion actualizada exitosamente"
            )
        except ValueError:
            raise BusinessError(
                f"Promocion con ID {promocion_id} no encontrada", 404
            )
        except Exception as e:
            logger.error(f"Error actualizando promocion: {e}")
            raise BusinessError("Error interno actualizando la promocion", 500)

    async def delete_promocion(self, promocion_id: int) -> Dict:
        try:
            # Eliminaci�n f�sica para permitir borrar activas o inactivas
            await self.promocion_repository.delete_physical(promocion_id)
            return ResponseHandler.success_delete("Promocion eliminada exitosamente")
        except ValueError:
            raise BusinessError(
                f"Promocion con ID {promocion_id} no encontrada", 404
            )
        except Exception as e:
            logger.error(f"Error eliminando promocion: {e}")
            raise BusinessError("Error interno eliminando la promocion", 500)
