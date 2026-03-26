from app.services.auditoria.log_error_service import LogErrorService
from app.models.auditoria.log_error import TipoError, ModuloSistema
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ErrorLogger:
    """
    Clase helper para registrar errores manualmente desde cualquier parte del sistema.
    """
    
    @staticmethod
    async def log_database_error(
        db: Session,
        modulo: ModuloSistema,
        descripcion: str,
        usuario_id: Optional[int] = None,
        excepcion: Optional[Exception] = None,
        contexto: Optional[Dict[str, Any]] = None
    ):
        """Registra un error de base de datos"""
        try:
            await LogErrorService.registrar_error(
                db=db,
                tipo_error=TipoError.DATABASE,
                modulo=modulo,
                descripcion_tecnica=descripcion,
                usuario_id=usuario_id,
                detalles_adicionales=contexto,
                excepcion=excepcion
            )
        except Exception as e:
            logger.error(f"Error logging database error: {e}")
    
    @staticmethod
    async def log_api_error(
        db: Session,
        modulo: ModuloSistema,
        descripcion: str,
        usuario_id: Optional[int] = None,
        excepcion: Optional[Exception] = None,
        contexto: Optional[Dict[str, Any]] = None
    ):
        """Registra un error de API"""
        try:
            await LogErrorService.registrar_error(
                db=db,
                tipo_error=TipoError.API,
                modulo=modulo,
                descripcion_tecnica=descripcion,
                usuario_id=usuario_id,
                detalles_adicionales=contexto,
                excepcion=excepcion
            )
        except Exception as e:
            logger.error(f"Error logging API error: {e}")
    
    @staticmethod
    async def log_validation_error(
        db: Session,
        modulo: ModuloSistema,
        descripcion: str,
        usuario_id: Optional[int] = None,
        excepcion: Optional[Exception] = None,
        contexto: Optional[Dict[str, Any]] = None
    ):
        """Registra un error de validación"""
        try:
            await LogErrorService.registrar_error(
                db=db,
                tipo_error=TipoError.VALIDATION,
                modulo=modulo,
                descripcion_tecnica=descripcion,
                usuario_id=usuario_id,
                detalles_adicionales=contexto,
                excepcion=excepcion
            )
        except Exception as e:
            logger.error(f"Error logging validation error: {e}")
    
    @staticmethod
    async def log_authentication_error(
        db: Session,
        modulo: ModuloSistema,
        descripcion: str,
        usuario_id: Optional[int] = None,
        excepcion: Optional[Exception] = None,
        contexto: Optional[Dict[str, Any]] = None
    ):
        """Registra un error de autenticación"""
        try:
            await LogErrorService.registrar_error(
                db=db,
                tipo_error=TipoError.AUTHENTICATION,
                modulo=modulo,
                descripcion_tecnica=descripcion,
                usuario_id=usuario_id,
                detalles_adicionales=contexto,
                excepcion=excepcion
            )
        except Exception as e:
            logger.error(f"Error logging authentication error: {e}")
    
    @staticmethod
    async def log_system_error(
        db: Session,
        modulo: ModuloSistema,
        descripcion: str,
        usuario_id: Optional[int] = None,
        excepcion: Optional[Exception] = None,
        contexto: Optional[Dict[str, Any]] = None
    ):
        """Registra un error del sistema"""
        try:
            await LogErrorService.registrar_error(
                db=db,
                tipo_error=TipoError.SYSTEM,
                modulo=modulo,
                descripcion_tecnica=descripcion,
                usuario_id=usuario_id,
                detalles_adicionales=contexto,
                excepcion=excepcion
            )
        except Exception as e:
            logger.error(f"Error logging system error: {e}")