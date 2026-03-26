from functools import wraps
from sqlalchemy.orm import Session
from app.models.auditoria.log_error import TipoError, ModuloSistema
from app.services.auditoria.log_error_service import LogErrorService
from typing import Callable, Optional
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, OperationalError
import logging

logger = logging.getLogger(__name__)

def capturar_errores(modulo: ModuloSistema):
    """
    Decorador para capturar y registrar errores automáticamente.
    
    Args:
        modulo: Módulo del sistema donde se aplica el decorador
    """
    def decorador(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            db = None
            usuario_id = None
            
            # Buscar la sesión de DB en los argumentos
            for arg in args:
                if isinstance(arg, Session):
                    db = arg
                    break
            
            # Si no encontramos DB en args, buscar en kwargs
            if db is None:
                db = kwargs.get('db')
            
            # Buscar usuario_id en kwargs
            usuario_id = kwargs.get('administrador_id') or kwargs.get('current_user_id')
            
            try:
                # Ejecutar la función original
                return await func(*args, **kwargs)
                
            except HTTPException:
                # Re-lanzar HTTPExceptions sin logear (son errores controlados)
                raise
                
            except IntegrityError as e:
                # Error de base de datos
                if db:
                    try:
                        await LogErrorService.registrar_error(
                            db=db,
                            tipo_error=TipoError.DATABASE,
                            modulo=modulo,
                            descripcion_tecnica=f"Error de integridad en {func.__name__}",
                            usuario_id=usuario_id,
                            detalles_adicionales={
                                "function_name": func.__name__,
                                "args_count": len(args),
                                "kwargs_keys": list(kwargs.keys())
                            },
                            excepcion=e
                        )
                    except Exception as log_error:
                        logger.error(f"Error logging IntegrityError: {log_error}")
                raise  # Re-lanzar la excepción original
                
            except OperationalError as e:
                # Error operacional de base de datos
                if db:
                    try:
                        await LogErrorService.registrar_error(
                            db=db,
                            tipo_error=TipoError.DATABASE,
                            modulo=modulo,
                            descripcion_tecnica=f"Error operacional en {func.__name__}",
                            usuario_id=usuario_id,
                            detalles_adicionales={
                                "function_name": func.__name__,
                                "operation": "database_operation"
                            },
                            excepcion=e
                        )
                    except Exception as log_error:
                        logger.error(f"Error logging OperationalError: {log_error}")
                raise  # Re-lanzar la excepción original
                
            except ValueError as e:
                # Error de validación
                if db:
                    try:
                        await LogErrorService.registrar_error(
                            db=db,
                            tipo_error=TipoError.VALIDATION,
                            modulo=modulo,
                            descripcion_tecnica=f"Error de validación en {func.__name__}",
                            usuario_id=usuario_id,
                            excepcion=e
                        )
                    except Exception as log_error:
                        logger.error(f"Error logging ValueError: {log_error}")
                raise  # Re-lanzar la excepción original
                
            except Exception as e:
                # Error genérico del sistema
                if db:
                    try:
                        await LogErrorService.registrar_error(
                            db=db,
                            tipo_error=TipoError.SYSTEM,
                            modulo=modulo,
                            descripcion_tecnica=f"Error del sistema en {func.__name__}: {str(e)}",
                            usuario_id=usuario_id,
                            excepcion=e
                        )
                    except Exception as log_error:
                        logger.error(f"Error logging system error: {log_error}")
                raise  # Re-lanzar la excepción original
                
        return wrapper
    return decorador