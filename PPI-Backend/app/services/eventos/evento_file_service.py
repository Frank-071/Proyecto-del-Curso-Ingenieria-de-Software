from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Dict, Optional, List
import logging
import asyncio
import json
from fastapi import UploadFile
from app.repositories.eventos import EventoRepository, ZonaRepository
from app.schemas.eventos import EventoRequest, EventoResponse, ZonaCreateRequest
from app.utils.handlers import ResponseHandler
from app.core.exceptions import BusinessError
from app.services.shared import CacheService, S3Service
from app.models import Evento, Zona

logger = logging.getLogger(__name__)


class EventoFileService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.evento_repository = EventoRepository(db)
        self.zona_repository = ZonaRepository(db)
    
    async def upload_evento_icono(
        self,
        evento_id: int,
        s3_service: S3Service,
        file: UploadFile
    ) -> Dict:
        if not file.content_type.startswith('image/'):
            raise BusinessError("El archivo debe ser una imagen", 400)
        
        evento = await self.evento_repository.get_by_id(evento_id)
        if not evento:
            raise BusinessError("Evento no encontrado", 404)
        
        try:
            upload_result = await s3_service.upload_evento_file(
                file, "events/galeria", str(evento_id), compress=False
            )
            await self.evento_repository.update(evento_id, {"icono": upload_result["url"]})
            
            await CacheService.invalidate_evento_full(evento_id)
            
            return ResponseHandler.success_response(
                {"icono_url": upload_result["url"]},
                "Icono subido exitosamente"
            )
        except Exception as e:
            logger.error(f"Error subiendo icono: {e}")
            raise BusinessError("Error al subir icono", 500)
    
    async def upload_evento_mapa(
        self,
        evento_id: int,
        s3_service: S3Service,
        file: UploadFile
    ) -> Dict:
        if not file.content_type.startswith('image/'):
            raise BusinessError("El archivo debe ser una imagen", 400)
        
        evento = await self.evento_repository.get_by_id(evento_id)
        if not evento:
            raise BusinessError("Evento no encontrado", 404)
        
        try:
            upload_result = await s3_service.upload_evento_file(
                file, "events/mapa", str(evento_id), compress=True
            )
            await self.evento_repository.update(evento_id, {"mapa": upload_result["url"]})
            
            await CacheService.invalidate_evento_full(evento_id)
            
            return ResponseHandler.success_response(
                {"mapa_url": upload_result["url"]},
                "Mapa subido exitosamente"
            )
        except Exception as e:
            logger.error(f"Error subiendo mapa: {e}")
            raise BusinessError("Error al subir mapa", 500)
    
    async def create_evento_with_files(
        self,
        evento_data: EventoRequest,
        s3_service: S3Service,
        validate_fn,
        icono: Optional[UploadFile] = None,
        mapa: Optional[UploadFile] = None
    ) -> Dict:
        self._validate_image_files(icono, mapa)
        validate_fn(evento_data)
        
        try:
            zonas_raw = evento_data.zonas or "[]"
            logger.info(f"🔍 DEBUG - zonas_raw recibido: {zonas_raw}")
            
            try:
                zonas_data = json.loads(zonas_raw)
                logger.info(f"🔍 DEBUG - zonas_data parseado: {zonas_data}")
            except json.JSONDecodeError as e:
                logger.error(f"Error parseando zonas JSON: {e}")
                raise BusinessError("El formato de las zonas no es válido. Por favor, verifique los datos enviados", 400)
            
            if not isinstance(zonas_data, list):
                raise BusinessError("Las zonas deben ser una lista", 400)
            
            # Validar zonas ANTES de crear nada
            if zonas_data:
                try:
                    zonas_validadas = [ZonaCreateRequest(**zona) for zona in zonas_data]
                    logger.info(f"✅ DEBUG - {len(zonas_validadas)} zonas validadas correctamente")
                except Exception as e:
                    logger.error(f"Error validando zonas: {e}")
                    raise BusinessError("Los datos de las zonas son incorrectos. Verifique que todos los campos requeridos estén completos", 400)
            else:
                zonas_validadas = []
                logger.warning(f"⚠️ DEBUG - No hay zonas para crear (lista vacía)")
            
            # TRANSACCIÓN ATÓMICA: Crear evento + zonas en una sola transacción
            evento_dict = evento_data.model_dump(exclude={'zonas'})
            db_evento = Evento(**evento_dict)
            self.db.add(db_evento)
            await self.db.flush()
            evento_id = db_evento.id
            
            # Crear zonas sin commit individual
            if zonas_validadas:
                logger.info(f"🔄 DEBUG - Creando {len(zonas_validadas)} zonas para evento_id: {evento_id}")
                for idx, zona in enumerate(zonas_validadas):
                    zona_dict = zona.model_dump()
                    zona_dict['evento_id'] = evento_id
                    db_zona = Zona(**zona_dict)
                    self.db.add(db_zona)
                    logger.info(f"  ✓ Zona {idx+1}/{len(zonas_validadas)}: {zona_dict.get('nombre', 'Sin nombre')}")
            else:
                logger.warning(f"⚠️ DEBUG - No se crearán zonas (lista vacía)")
            
            # Commit de todo junto (evento + zonas)
            await self.db.commit()
            logger.info(f"💾 DEBUG - Commit exitoso de evento y zonas")
            await self.db.refresh(db_evento)
            
            upload_results = await self._process_file_uploads(s3_service, evento_id, icono, mapa)
            
            CacheService.safe_invalidate_async(
                CacheService.invalidate_evento_lists(),
                "evento_with_files_created"
            )
            
            evento_response = EventoResponse.model_validate(db_evento)
            
            zonas_count = len(zonas_data) if zonas_data else 0
            return self._build_file_upload_response(
                evento_response, 
                evento_id, 
                upload_results, 
                f"Evento creado exitosamente con {zonas_count} zona(s)"
            )
        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Error de integridad creando evento: {e}")
            raise BusinessError("Error de integridad al crear evento. Verifique que el local, categoría y organizador existan", 400)
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Error de base de datos creando evento: {e}")
            raise BusinessError("Error de base de datos al crear evento", 500)
        except BusinessError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creando evento con archivos: {e}")
            raise BusinessError("Error interno al crear evento", 500)
    
    async def update_evento_with_files(
        self,
        evento_id: int,
        evento_data: EventoRequest,
        s3_service: S3Service,
        validate_fn,
        icono: Optional[UploadFile] = None,
        mapa: Optional[UploadFile] = None
    ) -> Dict:
        validate_fn(evento_data)
        self._validate_image_files(icono, mapa)
        
        evento_existente = await self.evento_repository.get_by_id(evento_id)
        if not evento_existente:
            raise BusinessError("Evento no encontrado", 404)
        
        try:
            # Procesar zonas
            zonas_raw = evento_data.zonas or "[]"
            logger.info(f"DEBUG UPDATE - zonas_raw recibido: {zonas_raw}")
            
            try:
                zonas_data = json.loads(zonas_raw)
                logger.info(f"DEBUG UPDATE - zonas_data parseado: {zonas_data}")
            except json.JSONDecodeError as e:
                logger.error(f"Error parseando zonas JSON en update: {e}")
                raise BusinessError("El formato de las zonas no es válido", 400)
            
            if not isinstance(zonas_data, list):
                raise BusinessError("Las zonas deben ser una lista", 400)
            
            # Validar zonas
            if zonas_data:
                try:
                    zonas_validadas = [ZonaCreateRequest(**zona) for zona in zonas_data]
                    logger.info(f"DEBUG UPDATE - {len(zonas_validadas)} zonas validadas")
                except Exception as e:
                    logger.error(f"Error validando zonas en update: {e}")
                    raise BusinessError("Los datos de las zonas son incorrectos", 400)
            else:
                zonas_validadas = []
                logger.warning(f"DEBUG UPDATE - No hay zonas para actualizar")
            
            # Actualizar evento (sin zonas)
            evento_dict = evento_data.model_dump(exclude={'zonas'})
            await self.evento_repository.update(evento_id, evento_dict)
            
            # Obtener zonas existentes
            zonas_existentes = await self.zona_repository.get_by_evento(evento_id)
            zonas_existentes_dict = {zona.id: zona for zona in zonas_existentes}
            logger.info(f"DEBUG UPDATE - zonas existentes: {list(zonas_existentes_dict.keys())}")
            
            # Procesar zonas nuevas y actualizaciones
            zonas_nuevas_ids = set()
            for idx, zona in enumerate(zonas_validadas):
                zona_dict = zona.model_dump()
                logger.info(f"DEBUG UPDATE - procesando zona {idx+1}: {zona_dict}")
                zona_dict['evento_id'] = evento_id
                
                if 'id' in zona_dict and zona_dict['id']:
                    # Actualizar zona existente
                    zona_id = zona_dict['id']
                    logger.info(f"DEBUG UPDATE - intentando actualizar zona con ID: {zona_id}")
                    if zona_id in zonas_existentes_dict:
                        await self.zona_repository.update(zona_id, zona_dict)
                        zonas_nuevas_ids.add(zona_id)
                        logger.info(f"DEBUG UPDATE - zona {zona_id} actualizada")
                    else:
                        logger.warning(f"DEBUG UPDATE - zona ID {zona_id} no existe en BD")
                else:
                    # Crear nueva zona
                    logger.info(f"DEBUG UPDATE - creando nueva zona: {zona_dict.get('nombre')}")
                    zona_dict.pop('id', None)
                    db_zona = Zona(**zona_dict)
                    self.db.add(db_zona)
                    await self.db.flush()  # Obtener el ID de la zona recién creada
                    zonas_nuevas_ids.add(db_zona.id)  # Agregar al conjunto para evitar eliminación
                    logger.info(f"DEBUG UPDATE - nueva zona creada con ID: {db_zona.id}")
            
            # Eliminar zonas que ya no están en la lista
            zonas_a_eliminar = []
            for zona_id, zona in zonas_existentes_dict.items():
                if zona_id not in zonas_nuevas_ids:
                    zonas_a_eliminar.append(zona_id)
                    logger.info(f"DEBUG UPDATE - zona a eliminar: {zona_id} - {zona.nombre}")
            
            if zonas_a_eliminar:
                logger.info(f"DEBUG UPDATE - se eliminaran {len(zonas_a_eliminar)} zonas: {zonas_a_eliminar}")
                for zona_id in zonas_a_eliminar:
                    zona = zonas_existentes_dict[zona_id]
                    
                    # Verificar si la zona tiene entradas vendidas
                    if hasattr(zona, 'entradas') and zona.entradas:
                        # Si tiene entradas, no se puede eliminar físicamente
                        logger.warning(f"DEBUG UPDATE - zona {zona_id} tiene entradas asociadas, no se puede eliminar")
                        raise BusinessError(
                            f"No se puede eliminar la zona '{zona.nombre}' porque tiene entradas vendidas. "
                            f"Por favor, contacte al administrador del sistema.",
                            400
                        )
                    
                    # Si no tiene entradas, proceder con la eliminación física
                    await self.zona_repository.delete_physical(zona.id)
                    logger.info(f"DEBUG UPDATE - zona {zona_id} eliminada físicamente")
            else:
                logger.info(f"DEBUG UPDATE - no hay zonas que eliminar")
            
            # Commit de todo
            await self.db.commit()
            logger.info(f"DEBUG UPDATE - Commit exitoso")
            
            upload_results = await self._process_file_uploads(s3_service, evento_id, icono, mapa)
            
            evento_actualizado = await self.evento_repository.get_by_id(evento_id)
            evento_response = EventoResponse.model_validate(evento_actualizado)
            
            await CacheService.invalidate_evento_full(evento_id)
            
            zonas_count = len(zonas_data) if zonas_data else 0
            return self._build_file_upload_response(
                evento_response, 
                evento_id, 
                upload_results, 
                f"Evento actualizado exitosamente con {zonas_count} zona(s)"
            )
        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Error de integridad actualizando evento: {e}")
            raise BusinessError("Error de integridad al actualizar evento", 400)
        except BusinessError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error actualizando evento con archivos: {e}")
            raise BusinessError("Error interno al actualizar evento", 500)
    
    def _validate_image_files(self, icono: Optional[UploadFile], mapa: Optional[UploadFile]) -> None:
        if icono and not icono.content_type.startswith('image/'):
            raise BusinessError("El icono debe ser una imagen", 400)
        if mapa and not mapa.content_type.startswith('image/'):
            raise BusinessError("El mapa debe ser una imagen", 400)
    
    async def _process_file_uploads(
        self,
        s3_service: S3Service,
        evento_id: int,
        icono: Optional[UploadFile],
        mapa: Optional[UploadFile]
    ) -> Dict[str, Dict]:
        upload_tasks = []
        task_types = []
        
        if icono:
            upload_tasks.append(self._upload_single_file(s3_service, icono, "events/galeria", evento_id, False))
            task_types.append('icono')
        
        if mapa:
            upload_tasks.append(self._upload_single_file(s3_service, mapa, "events/mapa", evento_id, True))
            task_types.append('mapa')
        
        results = {}
        if upload_tasks:
            upload_results = await asyncio.gather(*upload_tasks, return_exceptions=True)
            
            for task_type, result in zip(task_types, upload_results):
                if isinstance(result, Exception):
                    results[task_type] = {'success': False, 'error': str(result)}
                elif isinstance(result, dict):
                    results[task_type] = result
                    if result.get('success'):
                        update_data = {task_type: result['url']}
                        await self.evento_repository.update(evento_id, update_data)
                else:
                    results[task_type] = {'success': False, 'error': 'Error desconocido'}
        
        return results
    
    async def _upload_single_file(
        self,
        s3_service: S3Service,
        file: UploadFile,
        folder: str,
        evento_id: int,
        compress: bool
    ) -> Dict:
        try:
            upload_result = await s3_service.upload_evento_file(file, folder, str(evento_id), compress)
            return {'success': True, 'url': upload_result["url"]}
        except Exception as e:
            logger.error(f"Error subiendo archivo a {folder}: {e}")
            return {'success': False, 'error': str(e)}
    
    def _build_file_upload_response(
        self,
        evento_response: EventoResponse,
        evento_id: int,
        upload_results: Dict[str, Dict],
        base_message: str
    ) -> Dict:
        upload_errors = []
        for file_type, result in upload_results.items():
            if not result.get('success'):
                upload_errors.append(f"{file_type}: {result.get('error', 'Unknown error')}")
        
        message = base_message
        if upload_errors:
            message += f" (Advertencia: No se pudieron subir algunas imagenes - {', '.join(upload_errors)})"
        
        return {
            "success": True,
            "message": message,
            "evento_id": evento_id,
            "data": evento_response.model_dump(),
            "warnings": upload_errors if upload_errors else None
        }

