"""
Decorador para capturar errores en endpoints de routers
"""
import logging
from functools import wraps
from typing import Callable, Any
from sqlalchemy.exc import IntegrityError, OperationalError
from fastapi import Request, HTTPException
from app.models.auditoria.log_error import TipoError, ModuloSistema
from app.core.auditoria.error_logger import ErrorLogger

logger = logging.getLogger(__name__)


def capturar_errores_router(modulo: ModuloSistema):
    """
    Decorador para capturar errores en endpoints de routers
    
    Args:
        modulo: Módulo del sistema donde ocurre el error
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            try:
                # Buscar Request en kwargs o argumentos
                request = kwargs.get('request')
                if not request:
                    for arg in args:
                        if hasattr(arg, 'client') and hasattr(arg.client, 'host'):
                            request = arg
                            break
                
                # Buscar usuario en kwargs
                current_user = kwargs.get('current_user') or kwargs.get('current_admin')
                usuario_id = None
                if current_user and hasattr(current_user, 'id'):
                    usuario_id = current_user.id
                
                return await func(*args, **kwargs)
                
            except AttributeError as e:
                error_msg = str(e)
                ip_cliente = request.client.host if request and hasattr(request, 'client') else "Unknown"
                
                await ErrorLogger.log_validation_error(
                    error=error_msg,
                    detalles={
                        "funcion": func.__name__,
                        "modulo": modulo.value,
                        "error_type": "AttributeError",
                        "ip_cliente": ip_cliente
                    },
                    usuario_id=usuario_id,
                )
                
                logger.error(f"AttributeError en {func.__name__}: {error_msg}")
                
                # Re-raise como HTTPException para FastAPI
                if "has no attribute" in error_msg:
                    raise HTTPException(status_code=500, detail="Error interno del servidor")
                raise
                
            except HTTPException:
                # Re-raise HTTPException sin modificar
                raise
                
            except Exception as e:
                error_msg = str(e)
                ip_cliente = request.client.host if request and hasattr(request, 'client') else "Unknown"
                
                await ErrorLogger.log_system_error(
                    error=error_msg,
                    detalles={
                        "funcion": func.__name__,
                        "modulo": modulo.value,
                        "tipo_excepcion": type(e).__name__,
                        "ip_cliente": ip_cliente
                    },
                    usuario_id=usuario_id,
                )
                
                logger.error(f"Error inesperado en {func.__name__}: {error_msg}")
                raise HTTPException(status_code=500, detail="Error interno del servidor")
                
        return wrapper
    return decorator