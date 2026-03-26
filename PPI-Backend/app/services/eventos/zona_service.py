from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, func
from typing import Dict
import logging
import asyncio
from app.repositories.eventos import ZonaRepository, EntradaRepository
from app.schemas.eventos import ZonaRequest, ZonaResponse
from app.utils.handlers import ResponseHandler
from app.core.exceptions import BusinessError
from app.models import Entrada, Zona
from app.services.shared import CacheService
from app.core.auditoria.decorador_auditoria import auditar_operacion
from app.models.auditoria.auditoria_evento import EntidadAfectada
from app.core.auditoria.decorador_errores import capturar_errores
from app.models.auditoria.log_error import ModuloSistema

logger = logging.getLogger(__name__)


class ZonaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.zona_repository = ZonaRepository(db)
        self.entrada_repository = EntradaRepository(db)
    
    def _validate_zona_data(self, zona_data: ZonaRequest) -> None:
        if zona_data.entradas_disponible > zona_data.stock_entradas:
            raise BusinessError("Las entradas disponibles no pueden superar el stock total", 400)
    
    def _handle_integrity_error(self, error: IntegrityError) -> None:
        """Parsea errores de integridad de la BD y lanza BusinessError con mensaje claro"""
        error_msg = str(error.orig).lower()
        
        if "duplicate entry" in error_msg and "primary" in error_msg:
            raise BusinessError("Error al generar ID. Contacte al administrador del sistema", 500)
        elif "evento_id" in error_msg or "fk_zonas_eventos" in error_msg:
            raise BusinessError("Evento no encontrado", 404)
        else:
            logger.error(f"IntegrityError no manejado: {error.orig}")
            raise BusinessError("Error de integridad en la base de datos", 500)
    
    @auditar_operacion(EntidadAfectada.ZONAS)
    @capturar_errores(ModuloSistema.ZONAS)
    async def create_zona(self, zona_data: ZonaRequest, administrador_id: int) -> Dict:
        self._validate_zona_data(zona_data)
        
        try:
            zona_dict = zona_data.model_dump()
            zona_creada = await self.zona_repository.create(zona_dict)
            zona_response = ZonaResponse.model_validate(zona_creada)
            
            CacheService.safe_invalidate_async(
                CacheService.invalidate_evento_full(zona_data.evento_id),
                "zona_created"
            )
            
            return ResponseHandler.success_create(zona_response, "Zona creada exitosamente")
        except IntegrityError as e:
            self._handle_integrity_error(e)
    
    @auditar_operacion(EntidadAfectada.ZONAS)
    @capturar_errores(ModuloSistema.ZONAS)
    async def update_zona(self, zona_id: int, zona_data: ZonaRequest, administrador_id: int) -> Dict:
        self._validate_zona_data(zona_data)
        
        try:
            # ATOMICIDAD COMPLETA: Bloquear la zona con SELECT FOR UPDATE
            # Esto previene que se vendan entradas mientras actualizamos
            stmt_zona = select(Zona).where(Zona.id == zona_id).with_for_update()
            result_zona = await self.db.execute(stmt_zona)
            zona_existente = result_zona.scalar_one_or_none()
            
            if not zona_existente:
                raise BusinessError("Zona no encontrada", 404)
            
            # Contar entradas vendidas (dentro de la misma transacción con el lock)
            stmt_count = select(func.count(Entrada.id)).where(
                Entrada.zona_id == zona_id,
                Entrada.activo == True
            )
            result_count = await self.db.execute(stmt_count)
            entradas_vendidas = result_count.scalar() or 0
            
            # Validar que el nuevo stock no sea menor a las entradas vendidas
            if zona_data.stock_entradas < entradas_vendidas:
                raise BusinessError(
                    f"No se puede reducir el stock. Ya hay {entradas_vendidas} entradas vendidas", 
                    400
                )
            
            # Actualizar la zona (el lock se mantiene hasta el commit)
            await CacheService.invalidate_evento_full(zona_existente.evento_id)
            
            zona_dict = zona_data.model_dump()
            updated_zona = await self.zona_repository.update(zona_id, zona_dict)
            zona_response = ZonaResponse.model_validate(updated_zona)
            
            return ResponseHandler.success_update(zona_response, "Zona actualizada exitosamente")
            
        except IntegrityError as e:
            self._handle_integrity_error(e)
    
    async def get_zonas_by_evento(self, evento_id: int) -> Dict:
        """Obtiene todas las zonas de un evento específico"""
        zonas = await self.zona_repository.get_by_evento(evento_id)
        zonas_response = [ZonaResponse.model_validate(zona) for zona in zonas]
        return ResponseHandler.success_response(zonas_response, "Zonas obtenidas exitosamente")

