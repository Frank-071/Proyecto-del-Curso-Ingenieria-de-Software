from sqlalchemy.orm import Session
from app.models.auditoria.log_error import LogError, TipoError, ModuloSistema
from typing import Dict, Any, Optional
import traceback
import sys

class LogErrorService:
    
    @staticmethod
    async def registrar_error(
        db: Session,
        tipo_error: TipoError,
        modulo: ModuloSistema,
        descripcion_tecnica: str,
        usuario_id: Optional[int] = None,
        detalles_adicionales: Optional[Dict[str, Any]] = None,
        excepcion: Optional[Exception] = None
    ) -> LogError:
        """
        Registra un error en el sistema.
        
        Args:
            db: Sesión de base de datos
            tipo_error: Tipo de error (DATABASE, API, etc.)
            modulo: Módulo donde ocurrió el error
            descripcion_tecnica: Descripción técnica del error
            usuario_id: ID del usuario (opcional)
            detalles_adicionales: Información adicional en formato JSON
            excepcion: Excepción original para extraer más información
        """
        
        # Enriquecer detalles con información de la excepción
        if excepcion:
            if detalles_adicionales is None:
                detalles_adicionales = {}
            
            detalles_adicionales.update({
                "exception_type": type(excepcion).__name__,
                "exception_message": str(excepcion),
                "traceback": traceback.format_exc() if sys.exc_info()[0] else None
            })
        
        log_error = LogError(
            usuario_id=usuario_id,
            tipo_error=tipo_error,
            modulo=modulo,
            descripcion_tecnica=descripcion_tecnica,
            detalles_adicionales=detalles_adicionales
        )
        
        db.add(log_error)
        db.commit()
        db.refresh(log_error)
        
        return log_error
    
    @staticmethod
    def crear_contexto_error(
        request_path: Optional[str] = None,
        request_method: Optional[str] = None,
        request_data: Optional[Dict] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea un diccionario con contexto adicional para el error.
        """
        contexto = {}
        
        if request_path:
            contexto["request_path"] = request_path
        if request_method:
            contexto["request_method"] = request_method
        if request_data:
            contexto["request_data"] = request_data
        if user_agent:
            contexto["user_agent"] = user_agent
        if ip_address:
            contexto["ip_address"] = ip_address
            
        return contexto