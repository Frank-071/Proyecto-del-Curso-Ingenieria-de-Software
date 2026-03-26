from functools import wraps
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.auditoria.auditoria_evento import AuditoriaEvento, TipoEvento, EntidadAfectada
from app.services.auditoria.auditoria_service import AuditoriaService
from typing import Dict, Any, Optional, Callable
import json
from datetime import datetime

def auditar_operacion(entidad_afectada: EntidadAfectada):
    """
    Decorador para auditar operaciones CRUD automáticamente.
    
    Args:
        entidad_afectada: Tipo de entidad que se está modificando
    """
    def decorador(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener la sesión de DB y el ID del administrador del contexto
            db = None
            administrador_id = None
            entidad_id = None
            estado_anterior = None
            
            # Buscar la sesión de DB en los argumentos
            for arg in args:
                if isinstance(arg, AsyncSession):
                    db = arg
                    break
            
            # Si no encontramos DB en args, buscar en kwargs
            if db is None:
                db = kwargs.get('db')
            
            # Si no encontramos DB, intentar obtenerla desde self (para servicios)
            if db is None and args and hasattr(args[0], 'local_repository'):
                if hasattr(args[0].local_repository, 'db'):
                    db = args[0].local_repository.db
            elif db is None and args and hasattr(args[0], 'evento_repository'):
                if hasattr(args[0].evento_repository, 'db'):
                    db = args[0].evento_repository.db
            elif db is None and args and hasattr(args[0], 'zona_repository'):
                if hasattr(args[0].zona_repository, 'db'):
                    db = args[0].zona_repository.db
            elif db is None and args and hasattr(args[0], 'usuario_repository'):
                if hasattr(args[0].usuario_repository, 'db'):
                    db = args[0].usuario_repository.db
            elif db is None and args and hasattr(args[0], 'db'):
                # Para servicios que tienen db directamente como EventoService
                db = args[0].db
            
            # Buscar el administrador_id en kwargs o en el contexto
            administrador_id = kwargs.get('administrador_id') or kwargs.get('current_user_id')
            
            # Si no está en kwargs, buscar en args (diferentes posiciones según el método)
            if administrador_id is None:
                # Buscar el administrador_id recorriendo todos los argumentos de derecha a izquierda
                # para encontrar el último entero (que suele ser el administrador_id)
                for i in range(len(args) - 1, 0, -1):  # Empezar desde el final, evitar args[0] (self)
                    if isinstance(args[i], int) and args[i] > 0:  # Buscar enteros positivos
                        administrador_id = args[i]
                        print(f"[DEBUG] Administrador ID encontrado en args[{i}]: {administrador_id}")
                        break
            
            print(f"[DEBUG] Administrador ID encontrado: {administrador_id}")
            
            # Determinar el tipo de operación basado en el nombre de la función
            tipo_evento = None
            func_name_lower = func.__name__.lower()
            if 'crear' in func_name_lower or 'create' in func_name_lower:
                tipo_evento = TipoEvento.CREATE
            elif ('actualizar' in func_name_lower or 'update' in func_name_lower or 
                  'toggle' in func_name_lower or 'cambiar' in func_name_lower or 
                  'estado' in func_name_lower):
                tipo_evento = TipoEvento.UPDATE
            elif 'eliminar' in func_name_lower or 'delete' in func_name_lower:
                tipo_evento = TipoEvento.DELETE
            
            # Para UPDATE y DELETE, intentar obtener el estado anterior
            if tipo_evento in [TipoEvento.UPDATE, TipoEvento.DELETE]:
                # Buscar ID en kwargs primero
                entity_id_param = kwargs.get('id') or kwargs.get('evento_id') or kwargs.get('local_id') or kwargs.get('zona_id')
                
                # Si no está en kwargs, buscar en args por posición
                if entity_id_param is None:
                    # Para métodos de servicio: args[0] = self, args[1] = ID
                    if len(args) >= 2 and isinstance(args[1], int):
                        entity_id_param = args[1]
                        print(f"[DEBUG] ID obtenido de args[1]: {entity_id_param}")
                
                if entity_id_param and db:
                    print(f"[DEBUG] Obteniendo estado anterior para UPDATE/DELETE con ID: {entity_id_param}")
                    estado_anterior = await _obtener_estado_anterior(db, entidad_afectada, entity_id_param)
                    entidad_id = entity_id_param
            
            # Ejecutar la función original
            resultado = await func(*args, **kwargs)
            
            # Solo auditar si tenemos los datos mínimos necesarios
            if db and administrador_id and tipo_evento:
                print(f"[AUDITORIA] Iniciando auditoría - DB: {db is not None}, Admin: {administrador_id}, Tipo: {tipo_evento}")
                print(f"[AUDITORIA] Parámetros - args: {len(args)}, kwargs: {list(kwargs.keys())}")
                
                try:
                    # Para CREATE, obtener el ID del resultado
                    if tipo_evento == TipoEvento.CREATE:
                        if hasattr(resultado, 'data'):
                            if hasattr(resultado.data, 'evento_id'):
                                entidad_id = resultado.data.evento_id
                            elif hasattr(resultado.data, 'local_id'):
                                entidad_id = resultado.data.local_id
                            elif hasattr(resultado.data, 'zona_id'):
                                entidad_id = resultado.data.zona_id
                            elif hasattr(resultado.data, 'id'):
                                entidad_id = resultado.data.id
                        elif isinstance(resultado, dict) and 'data' in resultado:
                            data = resultado['data']
                            if isinstance(data, dict):
                                entidad_id = data.get('local_id') or data.get('evento_id') or data.get('zona_id') or data.get('id')
                    
                    print(f"[AUDITORIA] Entidad ID: {entidad_id}")
                    
                    # Obtener estado nuevo para CREATE y UPDATE
                    estado_nuevo = None
                    if tipo_evento in [TipoEvento.CREATE, TipoEvento.UPDATE] and entidad_id:
                        estado_nuevo = await _obtener_estado_actual(db, entidad_afectada, entidad_id)
                    
                    print(f"[AUDITORIA] Estado anterior: {estado_anterior is not None}, Estado nuevo: {estado_nuevo is not None}")
                    
                    # Registrar la auditoría
                    auditoria_result = await AuditoriaService.registrar_evento(
                        db=db,
                        administrador_id=administrador_id,
                        tipo_evento=tipo_evento,
                        entidad_afectada=entidad_afectada,
                        entidad_id=entidad_id,
                        estado_anterior=estado_anterior,
                        estado_nuevo=estado_nuevo
                    )
                    print(f"[AUDITORIA] Evento registrado con ID: {auditoria_result.auditoria_id}")
                except Exception as e:
                    # No fallar la operación principal por errores de auditoría
                    print(f"[AUDITORIA] Error en auditoría: {e}")
            else:
                print(f"[AUDITORIA] No se puede auditar - DB: {db is not None}, Admin: {administrador_id}, Tipo: {tipo_evento}")
            
            return resultado
        return wrapper
    return decorador

async def _obtener_estado_anterior(db: AsyncSession, entidad: EntidadAfectada, entidad_id: int) -> Optional[Dict]:
    """Obtiene el estado anterior de una entidad antes de modificarla"""
    try:
        print(f"[DEBUG] Obteniendo estado anterior para {entidad} con ID {entidad_id}")
        if entidad == EntidadAfectada.EVENTOS:
            from app.models.eventos.evento import Evento
            result = await db.execute(select(Evento).where(Evento.id == entidad_id))
            obj = result.scalar_one_or_none()
        elif entidad == EntidadAfectada.LOCALES:
            from app.models.locales.local import Local
            result = await db.execute(select(Local).where(Local.id == entidad_id))
            obj = result.scalar_one_or_none()
            print(f"[DEBUG] Objeto Local encontrado: {obj is not None}")
            if obj:
                print(f"[DEBUG] Local ID: {obj.id}, Nombre: {obj.nombre}")
        elif entidad == EntidadAfectada.ZONAS:
            from app.models.eventos.zona import Zona
            result = await db.execute(select(Zona).where(Zona.id == entidad_id))
            obj = result.scalar_one_or_none()
        elif entidad == EntidadAfectada.USUARIOS:
            from app.models.auth.usuario import Usuario
            result = await db.execute(select(Usuario).where(Usuario.id == entidad_id))
            obj = result.scalar_one_or_none()
            print(f"[DEBUG] Objeto Usuario encontrado: {obj is not None}")
            if obj:
                print(f"[DEBUG] Usuario ID: {obj.id}, Email: {obj.email}")
        else:
            return None
        
        serialized = AuditoriaService.serializar_objeto(obj) if obj else None
        print(f"[DEBUG] Objeto serializado: {serialized is not None}")
        return serialized
    except Exception as e:
        print(f"Error obteniendo estado anterior: {e}")
        return None

async def _obtener_estado_actual(db: AsyncSession, entidad: EntidadAfectada, entidad_id: int) -> Optional[Dict]:
    """Obtiene el estado actual de una entidad después de modificarla"""
    try:
        # Refrescar la sesión para obtener los datos actualizados, pero sin hacer commit
        await db.flush()  # Asegurar que los cambios estén en la DB pero sin commit
        return await _obtener_estado_anterior(db, entidad, entidad_id)
    except Exception as e:
        print(f"Error obteniendo estado actual: {e}")
        return None