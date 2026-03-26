import logging
from typing import Dict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from fastapi import UploadFile

from app.core.exceptions import BusinessError
from app.repositories.auth import UsuarioRepository, ClienteRepository
from app.schemas.auth.usuario import UsuarioCreate, UsuarioResponse, ProfileResponse, ProfileUpdate, PasswordChangeRequest
from app.services.shared import S3Service, CacheService
from app.utils.handlers import ResponseHandler
from app.utils.security import hash_password, verify_password
from app.models import Usuario, Cliente
from app.core.infrastructure import redis_client
from app.core.config import settings
from app.core.auditoria.decorador_auditoria import auditar_operacion
from app.models.auditoria.auditoria_evento import EntidadAfectada
from app.core.auditoria.decorador_errores import capturar_errores
from app.models.auditoria.log_error import ModuloSistema
import json

logger = logging.getLogger(__name__)

class UsuarioService:
    def __init__(self, db: AsyncSession):
        self.usuario_repository = UsuarioRepository(db)
        self.cliente_repository = ClienteRepository(db)

    async def _validate_usuario_exists(self, usuario_id: int) -> None:
        if not await self.usuario_repository.exists(usuario_id):
            raise BusinessError("Usuario no encontrado", 404)

    async def _prepare_usuario_data(self, usuario_data: UsuarioCreate) -> dict:
        password = usuario_data.contrasena
        if not password:
            raise BusinessError("Contraseña requerida", 400)
        
        usuario_dict = usuario_data.model_dump()
        usuario_dict["contrasena"] = await hash_password(password)
        return usuario_dict

    async def _create_cliente_record(self, usuario_id: int) -> None:
        cliente_dict = {
            "id": usuario_id,
            "rango_id": 1,
            "puntos_disponibles": 0,
            "puntos_historicos": 0,
            "recibir_notificaciones": True
        }
        await self.cliente_repository.create(cliente_dict)

    def _build_profile_response(self, usuario, cliente=None) -> Dict:
        """Construir respuesta de perfil desde objeto Usuario y Cliente"""
        profile_data = {
            "nombres": usuario.nombres,
            "apellidos": usuario.apellidos,
            "email": usuario.email,
            "genero": usuario.genero,
            "telefono": usuario.telefono,
            "numero_documento": usuario.numero_documento,
            "tipo_documento_nombre": usuario.tipo_documento.nombre if usuario.tipo_documento else "No especificado",
            "recibir_informacion_eventos": cliente.recibir_notificaciones if cliente else True
        }
        profile_response = ProfileResponse.model_validate(profile_data)
        return profile_response.model_dump()

    async def get_all_usuarios(self) -> Dict:
        logger.info("Obteniendo lista de todos los usuarios")
        usuarios = await self.usuario_repository.get_all_records()
        usuarios_response = [UsuarioResponse.model_validate(u) for u in usuarios]
        logger.info(f"Se obtuvieron {len(usuarios_response)} usuarios exitosamente")
        return ResponseHandler.success_list(usuarios_response, "Usuarios obtenidos exitosamente")

    async def get_all_usuarios_new(
        self, 
        skip: int = 0, 
        limit: int = 10, 
        activo: bool | None = None, 
        busqueda: str | None = None
    ) -> Dict:
        logger.info("Obteniendo lista de todos los usuarios paginada")
        usuarios = await self.usuario_repository.get_all_records()

        # Filtrar por activo
        if activo is not None:
            usuarios = [u for u in usuarios if u.activo == activo]

        # Filtrar por busqueda
        if busqueda:
            usuarios = [
                u for u in usuarios
                if (
                    busqueda.lower() in (u.nombres or "").lower() or 
                    busqueda.lower() in (u.apellidos or "").lower() or
                    busqueda.lower() in (u.email or "").lower()
                )
            ]

        total = len(usuarios)

        # Paginación
        usuarios_pag = usuarios[skip : skip + limit]

        # Convertir a dict
        usuarios_response = []
        for u in usuarios_pag:
            user_data = u.copy() if hasattr(u, "copy") else dict(u.__dict__)
            if user_data["email"].endswith(".local") or user_data["email"].endswith(".test"):
                user_data["email"] = user_data["email"].replace(".local", ".com").replace(".test", ".com")
            usuarios_response.append(UsuarioResponse.model_validate(user_data))

        # **Aquí viene el truco:** devuelve en la forma que el frontend espera
        return {
            "success": True,
            "data": usuarios_response,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasNext": skip + limit < total,
                "hasPrev": skip > 0,
                "currentPage": (skip // limit) + 1,
                "totalPages": (total + limit - 1) // limit
            }
        }




    async def get_usuario_by_id(self, usuario_id: int) -> Dict:
        logger.info(f"Obteniendo usuario con ID: {usuario_id}")
        usuario = await self.usuario_repository.get_by_id(usuario_id)
        logger.info(f"Usuario {usuario_id} obtenido exitosamente")
        usuario_response = UsuarioResponse.model_validate(usuario)
        return ResponseHandler.success_response(usuario_response, "Usuario obtenido exitosamente")

    @auditar_operacion(EntidadAfectada.USUARIOS)
    @capturar_errores(ModuloSistema.USUARIOS)
    async def create_usuario(self, usuario_data: UsuarioCreate, administrador_id: int) -> Dict:
        logger.info(f"Creando nuevo usuario: {usuario_data.email}")
        
        try:
            usuario_dict = await self._prepare_usuario_data(usuario_data)
            
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
            
            logger.info(f"Usuario creado exitosamente - ID: {db_usuario.id}, Email: {db_usuario.email}")
            usuario_response = UsuarioResponse.model_validate(db_usuario)
            return ResponseHandler.success_create(usuario_response, "Usuario creado exitosamente")
            
        except SQLAlchemyError as e:
            await self.usuario_repository.db.rollback()
            logger.error(f"Error creando usuario: {e}")
            raise BusinessError("Error al crear usuario", 500)

    @auditar_operacion(EntidadAfectada.USUARIOS)
    @capturar_errores(ModuloSistema.USUARIOS)
    async def update_usuario(self, usuario_id: int, usuario_data: UsuarioCreate, administrador_id: int) -> Dict:
        logger.info(f"Actualizando usuario ID: {usuario_id}")
        await self._validate_usuario_exists(usuario_id)
        usuario_dict = await self._prepare_usuario_data(usuario_data)
        updated_usuario = await self.usuario_repository.update(usuario_id, usuario_dict)
        logger.info(f"Usuario {usuario_id} actualizado exitosamente")
        usuario_response = UsuarioResponse.model_validate(updated_usuario)
        return ResponseHandler.success_update(usuario_response, "Usuario actualizado exitosamente")

    @auditar_operacion(EntidadAfectada.USUARIOS)
    @capturar_errores(ModuloSistema.USUARIOS)
    async def delete_usuario(self, usuario_id: int, administrador_id: int) -> Dict:
        logger.info(f"Eliminando usuario ID: {usuario_id}")
        await self._validate_usuario_exists(usuario_id)
        await self.usuario_repository.delete(usuario_id)
        logger.info(f"Usuario {usuario_id} eliminado exitosamente")
        return ResponseHandler.success_delete("Usuario eliminado exitosamente")

    async def upload_profile_photo(self, usuario_id: str, file: UploadFile):
        # Validar que sea una imagen
        if not file.content_type.startswith('image/'):
            raise BusinessError("Solo se permiten imágenes", 400)
        
        # Validar tamaño (máximo 5MB)
        if file.size > 5 * 1024 * 1024:
            raise BusinessError("La imagen no puede ser mayor a 5MB", 400)
        
        # Subir nueva foto a S3 (sobrescribe automáticamente)
        s3_service = S3Service()
        result = await s3_service.upload_file(
            file=file,
            folder="users/profiles",
            user_id=usuario_id
        )
        
        # Actualizar en base de datos
        await self.cliente_repository.update(usuario_id, {"imagen_perfil": result["url"]})
        
        return ResponseHandler.success_update(
            {"url": result["url"], "filename": result["filename"]}, 
            "Foto de perfil actualizada correctamente"
        )

    async def delete_profile_photo(self, usuario_id: str):
        cliente = await self.cliente_repository.get_by_id(usuario_id)
        if not cliente:
            raise BusinessError("Cliente no encontrado", 404)
        
        if not cliente.imagen_perfil:
            raise BusinessError("No hay foto de perfil para eliminar", 404)
        
        # Extraer la clave S3 de la URL
        s3_key = cliente.imagen_perfil.split('/')[-2] + '/' + cliente.imagen_perfil.split('/')[-1]
        
        # Eliminar de S3
        s3_service = S3Service()
        await s3_service.delete_file(s3_key)
        
        # Actualizar en base de datos
        await self.cliente_repository.update(usuario_id, {"imagen_perfil": None})
        
        return ResponseHandler.success_delete("Foto de perfil eliminada correctamente")

    async def get_profile_photo(self, usuario_id: str):
        cliente = await self.cliente_repository.get_by_id(usuario_id)
        if not cliente:
            raise BusinessError("Cliente no encontrado", 404)
        
        if not cliente.imagen_perfil:
            return ResponseHandler.success_response({"url": None}, "No hay foto de perfil")
        
        return ResponseHandler.success_response(
            {"url": cliente.imagen_perfil}, 
            "Foto de perfil obtenida correctamente"
        )

    async def get_profile(self, usuario_id: str) -> Dict:
        """Obtener datos de perfil del cliente"""
        logger.info(f"Obteniendo perfil del usuario ID: {usuario_id}")
        
        cache_key = f"user_profile:{usuario_id}"
        
        # Intentar obtener del cache
        try:
            cached_data = await redis_client.client.get(cache_key)
            if cached_data:
                logger.info(f"Cache HIT para {cache_key}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Error accediendo a Redis: {e}")
        
        # Cache MISS - obtener de BD
        logger.info(f"Cache MISS para {cache_key}")
        usuario = await self.usuario_repository.get_by_id(int(usuario_id))
        if not usuario:
            raise BusinessError("Usuario no encontrado", 404)
        
        # Obtener datos del cliente
        cliente = await self.cliente_repository.get_by_id(int(usuario_id))
        
        profile_response = self._build_profile_response(usuario, cliente)
        response = ResponseHandler.success_response(profile_response, "Perfil obtenido exitosamente")
        
        # Guardar en cache
        try:
            await redis_client.client.setex(
                cache_key,
                settings.CACHE_TTL_USER_PROFILE,
                json.dumps(response, default=str)
            )
            logger.info(f"Cache guardado para {cache_key}")
        except Exception as e:
            logger.warning(f"Error guardando en Redis: {e}")
        
        logger.info(f"Perfil del usuario {usuario_id} obtenido exitosamente")
        return response

    async def update_profile(self, usuario_id: str, profile_data: ProfileUpdate) -> Dict:
        logger.info(f"Actualizando perfil del usuario ID: {usuario_id}")
        
        update_data = profile_data.model_dump(exclude_none=True)
        
        if not update_data:
            raise BusinessError("No se proporcionaron datos para actualizar", 400)
        
        usuario_fields = ['nombres', 'apellidos', 'email', 'genero', 'telefono']
        usuario_update = {k: v for k, v in update_data.items() if k in usuario_fields}
        cliente_update = {}
        
        if 'recibir_informacion_eventos' in update_data:
            cliente_update['recibir_notificaciones'] = update_data['recibir_informacion_eventos']
        
        try:
            if usuario_update:
                await self.usuario_repository.update(int(usuario_id), usuario_update)
            
            if cliente_update:
                await self.cliente_repository.update(int(usuario_id), cliente_update)
            
            # Invalidar ambos caches: el antiguo y el nuevo endpoint
            cache_key = f"user_profile:{usuario_id}"
            try:
                await redis_client.client.delete(cache_key)
                logger.info(f"Cache invalidado: {cache_key}")
            except Exception as e:
                logger.warning(f"Error invalidando cache {cache_key}: {e}")
            
            # Invalidar el nuevo cache del endpoint /clientes/perfil
            CacheService.safe_invalidate_async(
                CacheService.invalidate_cliente_perfil(int(usuario_id)),
                "perfil_actualizado"
            )
            
            logger.info(f"Perfil del usuario {usuario_id} actualizado exitosamente")
            return await self.get_profile(usuario_id)
            
        except SQLAlchemyError as e:
            logger.error(f"Error actualizando perfil del usuario {usuario_id}: {e}")
            if "Duplicate entry" in str(e) or "UNIQUE constraint" in str(e):
                raise BusinessError("El email ya está en uso por otro usuario", 400)
            raise BusinessError("Error al actualizar el perfil", 500)

    async def change_password(self, usuario_id: int, password_data: PasswordChangeRequest) -> Dict:
        """Cambiar contraseña del usuario autenticado"""
        logger.info(f"Intentando cambiar contraseña del usuario ID: {usuario_id}")
        
        try:
            usuario = await self.usuario_repository.get_by_id(usuario_id)
            if not usuario:
                logger.warning(f"Usuario {usuario_id} no encontrado al intentar cambiar contraseña")
                raise BusinessError("Usuario no encontrado", 404)
            
            # Verificar contraseña actual
            if not await verify_password(password_data.current_password, usuario.contrasena):
                logger.warning(f"Contraseña actual incorrecta para usuario {usuario_id}")
                raise BusinessError("La contraseña actual es incorrecta", 400)
            
            # Verificar que la nueva contraseña sea diferente a la actual
            if await verify_password(password_data.new_password, usuario.contrasena):
                logger.warning(f"Usuario {usuario_id} intentó cambiar a la misma contraseña")
                raise BusinessError("La nueva contraseña debe ser diferente a la contraseña actual", 400)
            
            hashed_new_password = await hash_password(password_data.new_password)
            updated = await self.usuario_repository.update_password(usuario_id, hashed_new_password)
            
            if not updated:
                logger.error(f"Error: No se pudo actualizar la contraseña del usuario {usuario_id}")
                raise BusinessError("No se pudo actualizar la contraseña", 500)
            
            logger.info(f"Contraseña del usuario {usuario_id} actualizada exitosamente")
            return ResponseHandler.success_response(
                message="Tu contraseña ha sido actualizada exitosamente"
            )
            
        except SQLAlchemyError as e:
            logger.error(f"Error de base de datos al cambiar contraseña del usuario {usuario_id}: {e}")
            raise BusinessError("Error al cambiar la contraseña", 500)
        
    @auditar_operacion(EntidadAfectada.USUARIOS)
    @capturar_errores(ModuloSistema.USUARIOS)
    async def toggle_usuario_status(self, usuario_id: int, activar: bool, administrador_id: int) -> Dict:
        logger.info(f"Cambiando estado del usuario {usuario_id} a {'activo' if activar else 'inactivo'}")

        usuario = await self.usuario_repository.get_by_id(usuario_id)
        if not usuario:
            raise BusinessError("Usuario no encontrado", 404)

        try:
            await self.usuario_repository.update(usuario_id, {"activo": activar})

            return ResponseHandler.success_response(
                {"activo": activar},
                f"Usuario {'activado' if activar else 'desactivado'} exitosamente"
            )
        except Exception as e:
            logger.error(f"Error cambiando estado del usuario {usuario_id}: {e}")
            raise BusinessError("Error interno al cambiar estado del usuario", 500)