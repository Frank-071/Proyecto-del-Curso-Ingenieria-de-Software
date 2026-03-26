from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from typing import Dict, Optional, List, TYPE_CHECKING
import logging
import json
import asyncio
from app.repositories.locales.local_repository import LocalRepository
from app.repositories.locales.tipo_local_repository import TipoLocalRepository
from app.schemas.locales.local import LocalRequest, LocalResponse
from app.utils.handlers import ResponseHandler
from app.core.exceptions import BusinessError
from app.core.infrastructure import redis_client
from app.core.config import settings
from app.services.shared import CacheService
from app.repositories.eventos.evento_repository import EventoRepository
from app.repositories.geografia.distrito_repository import DistritoRepository
from app.services.geocoding.geocode_service import geocode_address
from app.core.auditoria.decorador_auditoria import auditar_operacion
from app.models.auditoria.auditoria_evento import EntidadAfectada
from app.core.auditoria.decorador_errores import capturar_errores
from app.models.auditoria.log_error import ModuloSistema

if TYPE_CHECKING:
    from app.models.locales.local import Local

logger = logging.getLogger(__name__)


class LocalService:
    def __init__(self, db: AsyncSession):
        self.local_repository = LocalRepository(db)
        self.tipo_local_repository = TipoLocalRepository(db)
        self.evento_repository = EventoRepository(db)
        self.distrito_repository = DistritoRepository(db)
    
    async def _validate_and_prepare_local_data(self, local_data: LocalRequest) -> dict:
        if not await self.tipo_local_repository.exists(local_data.tipo_local_id):
            raise BusinessError("Tipo de local no encontrado", 404)
        return local_data.model_dump()
    
    async def get_all_locales(
        self, 
        skip: int = 0, 
        limit: int = 10,
        tipo_local_id: Optional[int] = None,
        activo: Optional[bool] = None,
        distrito_id: Optional[int] = None,
        busqueda: Optional[str] = None
    ) -> Dict:
        cache_key = self._build_cache_key(skip, limit, tipo_local_id, activo, distrito_id, busqueda)
        
        async def fetch():
            total = await self.local_repository.count_filtered(
                tipo_local_id=tipo_local_id,
                activo=activo,
                distrito_id=distrito_id,
                busqueda=busqueda
            )
            
            locales = await self.local_repository.get_all_filtered(
                skip=skip,
                limit=limit,
                tipo_local_id=tipo_local_id,
                activo=activo,
                distrito_id=distrito_id,
                busqueda=busqueda
            )
            
            locals_response = []
            for local in locales:
                local_dict = LocalResponse.model_validate(local).model_dump()
                local_dict['latitud'] = float(local_dict['latitud']) if local_dict.get('latitud') is not None else None
                local_dict['longitud'] = float(local_dict['longitud']) if local_dict.get('longitud') is not None else None

                local_dict['distrito_nombre'] = local.distrito.nombre if local.distrito else f"Distrito {local.distrito_id}"
                local_dict['tipo_local_nombre'] = local.tipo_local.nombre if local.tipo_local else f"Tipo {local.tipo_local_id}"
                locals_response.append(local_dict)
            
            response = ResponseHandler.success_response(locals_response, "Locales obtenidos exitosamente")
            response["pagination"] = {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasNext": skip + limit < total,
                "hasPrev": skip > 0,
                "currentPage": (skip // limit) + 1,
                "totalPages": (total + limit - 1) // limit
            }
            
            return response
        
        return await CacheService.get_or_fetch(
            cache_key=cache_key,
            tag_key="cache_tags:locales",
            fetch_fn=fetch,
            ttl=settings.CACHE_TTL_EVENTO_LIST
        )
    
    def _build_cache_key(
        self, 
        skip: int, 
        limit: int, 
        tipo_local_id: Optional[int],
        activo: Optional[bool],
        distrito_id: Optional[int],
        busqueda: Optional[str]
    ) -> str:
        return (
            f"locales:list:skip={skip}:limit={limit}:"
            f"tipo={tipo_local_id if tipo_local_id is not None else 'all'}:"
            f"activo={str(activo) if activo is not None else 'all'}:"
            f"distrito={distrito_id if distrito_id is not None else 'all'}:"
            f"busqueda={busqueda or 'all'}"
        )
    
    async def get_locales_by_distrito(self, distrito_id: int) -> Dict:
        logger.info(f"Obteniendo locales del distrito {distrito_id}")
        locales = await self.local_repository.get_by_distrito_id(distrito_id)
        locals_response = []
        for local in locales:
            ld = LocalResponse.model_validate(local).model_dump()
            ld['latitud'] = float(ld['latitud']) if ld.get('latitud') is not None else None
            ld['longitud'] = float(ld['longitud']) if ld.get('longitud') is not None else None
            locals_response.append(ld)
        logger.info(f"Se obtuvieron {len(locals_response)} locales del distrito {distrito_id} exitosamente")
        return ResponseHandler.success_list(locals_response, f"Locales del distrito {distrito_id} obtenidos exitosamente")
    
    async def get_local_by_id(self, local_id: int) -> dict:
        logger.info(f"Obteniendo local con ID: {local_id}")
        local = await self.local_repository.get_by_id_with_relations(local_id)
        if local is None:
            logger.warning(f"Local {local_id} no encontrado")
            raise BusinessError(f"Local con ID {local_id} no encontrado", 404)
        
        logger.info(f"Local {local_id} obtenido exitosamente")
        local_response = LocalResponse.model_validate(local)
        return ResponseHandler.success_response(local_response, "Local obtenido exitosamente")
    
    @auditar_operacion(EntidadAfectada.LOCALES)
    @capturar_errores(ModuloSistema.LOCALES)
    async def create_local(self, local_data: LocalRequest, administrador_id: int) -> Dict:
        logger.info(f"Creando nuevo local: {local_data.nombre}")
        
        try:
            local_dict = await self._validate_and_prepare_local_data(local_data)
            # intentar geocodificar si no vienen coordenadas
            if not local_dict.get("latitud") or not local_dict.get("longitud"):
                try:
                    distrito_obj = await self.distrito_repository.get_by_id(local_dict.get("distrito_id"))
                    provincia_nombre = distrito_obj.provincia.nombre if getattr(distrito_obj, 'provincia', None) else None
                    parts = [local_dict.get("direccion"), distrito_obj.nombre if distrito_obj else None, provincia_nombre]
                    query = ", ".join([p for p in parts if p])
                    coords = await geocode_address(query)
                    if coords:
                        local_dict["latitud"], local_dict["longitud"] = coords
                except Exception:
                    logger.debug("Geocoding failed or distrito lookup failed; continuing without coords")
            
            local_creado = await self.local_repository.create(local_dict)
            logger.info(f"Local creado exitosamente - ID: {local_creado.id}, Nombre: {local_creado.nombre}")
            local_response = LocalResponse.model_validate(local_creado)
            
            CacheService.safe_invalidate_async(
                CacheService.invalidate_lists("locales"),
                "local_created"
            )
            
            return ResponseHandler.success_create(local_response, "Local creado exitosamente")
            
        except IntegrityError as e:
            logger.error(f"Error de integridad al crear local: {e}")
            error_str = str(e.orig) if hasattr(e, 'orig') else str(e)
            if "distrito_id" in error_str:
                raise BusinessError("Distrito no encontrado", 404)
            elif "tipo_local_id" in error_str:
                raise BusinessError("Tipo de local no encontrado", 404)
            elif "direccion" in error_str or "Duplicate entry" in error_str:
                raise BusinessError("Ya existe un local con esa dirección.", 400)
            else:
                raise BusinessError("Error de integridad en los datos", 400)
    
    @auditar_operacion(EntidadAfectada.LOCALES)
    @capturar_errores(ModuloSistema.LOCALES)
    async def update_local(self, local_id: int, local_data: LocalRequest, administrador_id: int) -> Dict:
        logger.info(f"Actualizando local ID: {local_id} con datos: {local_data.nombre}")
        
        try:
            await CacheService.invalidate_lists("locales")
            
            local_dict = await self._validate_and_prepare_local_data(local_data)
            # intentar geocodificar si no vienen coordenadas
            if not local_dict.get("latitud") or not local_dict.get("longitud"):
                try:
                    distrito_obj = await self.distrito_repository.get_by_id(local_dict.get("distrito_id"))
                    provincia_nombre = distrito_obj.provincia.nombre if getattr(distrito_obj, 'provincia', None) else None
                    parts = [local_dict.get("direccion"), distrito_obj.nombre if distrito_obj else None, provincia_nombre]
                    query = ", ".join([p for p in parts if p])
                    coords = await geocode_address(query)
                    if coords:
                        local_dict["latitud"], local_dict["longitud"] = coords
                except Exception:
                    logger.debug("Geocoding failed or distrito lookup failed; continuing without coords")
            updated_local = await self.local_repository.update(local_id, local_dict)
            logger.info(f"Local {local_id} actualizado exitosamente")
            local_response = LocalResponse.model_validate(updated_local)
            
            return ResponseHandler.success_update(local_response, "Local actualizado exitosamente")
            
        except IntegrityError as e:
            logger.error(f"Error de integridad al actualizar local {local_id}: {e}")
            error_str = str(e.orig) if hasattr(e, 'orig') else str(e)
            if "distrito_id" in error_str:
                raise BusinessError("Distrito no encontrado", 404)
            elif "tipo_local_id" in error_str:
                raise BusinessError("Tipo de local no encontrado", 404)
            elif "direccion" in error_str or "Duplicate entry" in error_str:
                raise BusinessError("Ya existe un local con esa dirección.", 400)
            else:
                raise BusinessError("Error de integridad en los datos", 400)
    
    @auditar_operacion(EntidadAfectada.LOCALES)
    @capturar_errores(ModuloSistema.LOCALES)
    async def delete_local(self, local_id: int, administrador_id: int) -> Dict:
        logger.info(f"Eliminando local ID: {local_id}")
        
        await CacheService.invalidate_lists("locales")
        
        await self.local_repository.delete(local_id)
        logger.info(f"Local {local_id} eliminado exitosamente")
        
        return ResponseHandler.success_delete("Local eliminado exitosamente")
    
    @auditar_operacion(EntidadAfectada.LOCALES)
    @capturar_errores(ModuloSistema.LOCALES)
    async def toggle_local_status(self, local_id: int, activar: bool, administrador_id: int) -> Dict:
        logger.info(f"[TOGGLE_STATUS] Iniciando toggle_local_status para local {local_id}, activar={activar}, admin={administrador_id}")
        try:
            local_actual = await self.local_repository.get_by_id_all(local_id)
            if local_actual is None:
                raise BusinessError("Local no encontrado", 404)
            
            if not activar:
                evento_model = self.evento_repository.model_class
                eventos_no_finalizados = await self.evento_repository.db.execute(
                    select(evento_model).where(
                        evento_model.local_id == local_id,
                        evento_model.activo == True,
                        evento_model.estado != "Finalizado"
                    )
                )
                eventos_list = eventos_no_finalizados.scalars().all()
                if eventos_list:
                    logger.warning(f"No se puede desactivar el local {local_id}: eventos no finalizados asociados.")
                    raise BusinessError(
                        "No se puede desactivar el local porque existen eventos asociados que no están finalizados.",
                        400
                    )
            
            await CacheService.invalidate_lists("locales")
            await self.local_repository.update(local_id, {"activo": activar})
            return ResponseHandler.success_update(
                {"activo": activar}, 
                f"Local {'activado' if activar else 'desactivado'} exitosamente"
            )
        except IntegrityError as e:
            logger.error(f"Error de integridad al cambiar estado del local {local_id}: {e}")
            raise BusinessError("Local no encontrado", 404)
        except BusinessError:
            raise
        except Exception as e:
            logger.error(f"Error al cambiar estado del local {local_id}: {e}")
            raise BusinessError("Error interno del servidor", 500)

    async def get_pending_locales(self, limit: int = 10) -> Dict:
        locales = await self.local_repository.list_where_lat_null(skip=0, limit=limit)
        locals_response = []

        for local in locales:
            # base response from existing LocalResponse schema
            local_dict = LocalResponse.model_validate(local).model_dump()
            # Ensure lat/lon keys exist
            local_dict['latitud'] = float(local_dict['latitud']) if local_dict.get('latitud') is not None else None
            local_dict['longitud'] = float(local_dict['longitud']) if local_dict.get('longitud') is not None else None

            # distrito / provincia / departamento names (may be None if relations missing)
            distrito_nombre = None
            provincia_nombre = None
            departamento_nombre = None

            try:
                if getattr(local, 'distrito', None):
                    distrito_nombre = local.distrito.nombre
                    provincia_obj = getattr(local.distrito, 'provincia', None)
                    if provincia_obj:
                        provincia_nombre = provincia_obj.nombre
                        departamento_obj = getattr(provincia_obj, 'departamento', None)
                        if departamento_obj:
                            departamento_nombre = departamento_obj.nombre
            except Exception:
                # proteger contra relaciones inesperadas; no interrumpir la respuesta de prueba
                distrito_nombre = distrito_nombre or (f"Distrito {getattr(local, 'distrito_id', None)}")

            # Attach human-friendly names to response for testing
            local_dict['distrito_nombre'] = distrito_nombre
            local_dict['provincia_nombre'] = provincia_nombre
            local_dict['departamento_nombre'] = departamento_nombre

            # Build a geocode_query string suitable for Nominatim / OSM testing
            parts = [
                local_dict.get('direccion'),
                distrito_nombre,
                provincia_nombre,
            ]
            query = ", ".join([p for p in parts if p])
            local_dict['geocode_query'] = query

            locals_response.append(local_dict)

        return ResponseHandler.success_list(locals_response, f"Locales pendientes de geocoding (limit={limit})")
    
    async def create_locales_bulk(self, locales_data: List[LocalRequest], skip_geocoding: bool = True, skip_validation: bool = False) -> List["Local"]:
        """Crea múltiples locales en una sola transacción (bulk insert optimizado)
        
        Args:
            locales_data: Lista de LocalRequest a crear
            skip_geocoding: Si True, no hace geocoding (más rápido para importación masiva)
            skip_validation: Si True, asume que las validaciones ya se hicieron (más rápido)
        """
        logger.info(f"Creando {len(locales_data)} locales en bulk")
        
        try:
            # Validar tipos_local_id en batch si es necesario
            if not skip_validation:
                tipo_local_ids = list({local_data.tipo_local_id for local_data in locales_data})
                valid_tipo_local_ids = await self.local_repository.validate_tipos_local_ids(tipo_local_ids)
                invalid_tipo_local_ids = set(tipo_local_ids) - valid_tipo_local_ids
                if invalid_tipo_local_ids:
                    raise BusinessError(f"Tipos de local no encontrados: {invalid_tipo_local_ids}", 404)
            
            # Preparar datos sin geocoding (se puede hacer después en batch)
            locales_dict = []
            for local_data in locales_data:
                # Si skip_validation es True, asumimos que los datos ya están validados
                if skip_validation:
                    local_dict = local_data.model_dump()
                else:
                    local_dict = await self._validate_and_prepare_local_data(local_data)
                
                # En importación masiva, saltamos geocoding para mejorar performance
                # Se puede hacer después con un proceso batch
                if not skip_geocoding and (not local_dict.get("latitud") or not local_dict.get("longitud")):
                    try:
                        distrito_obj = await self.distrito_repository.get_by_id(local_dict.get("distrito_id"))
                        provincia_nombre = distrito_obj.provincia.nombre if getattr(distrito_obj, 'provincia', None) else None
                        parts = [local_dict.get("direccion"), distrito_obj.nombre if distrito_obj else None, provincia_nombre]
                        query = ", ".join([p for p in parts if p])
                        coords = await geocode_address(query)
                        if coords:
                            local_dict["latitud"], local_dict["longitud"] = coords
                    except Exception:
                        logger.debug("Geocoding failed; continuing without coords")
                
                # Asegurar que activo tenga valor por defecto
                if "activo" not in local_dict:
                    local_dict["activo"] = True
                
                locales_dict.append(local_dict)
            
            # Bulk insert en una sola transacción
            locales_creados = await self.local_repository.bulk_create(locales_dict)
            logger.info(f"{len(locales_creados)} locales creados exitosamente en bulk")
            
            # Invalidar cache una sola vez al final
            CacheService.safe_invalidate_async(
                CacheService.invalidate_lists("locales"),
                "locales_bulk_created"
            )
            
            return locales_creados
            
        except IntegrityError as e:
            logger.error(f"Error de integridad al crear locales en bulk: {e}")
            error_str = str(e.orig) if hasattr(e, 'orig') else str(e)
            if "distrito_id" in error_str:
                raise BusinessError("Uno o más distritos no encontrados", 404)
            elif "tipo_local_id" in error_str:
                raise BusinessError("Uno o más tipos de local no encontrados", 404)
            elif "direccion" in error_str or "Duplicate entry" in error_str:
                raise BusinessError("Uno o más locales tienen direcciones duplicadas.", 400)
            else:
                raise BusinessError("Error de integridad en los datos", 400)
        except BusinessError:
            raise
        except Exception as e:
            logger.error(f"Error inesperado al crear locales en bulk: {e}")
            raise BusinessError(f"Error al crear locales: {str(e)}", 500)

