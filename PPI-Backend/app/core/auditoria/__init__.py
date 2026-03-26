# Módulo de auditoría
from .decorador_auditoria import auditar_operacion
from .decorador_errores import capturar_errores
from .error_logger import ErrorLogger

__all__ = ["auditar_operacion", "capturar_errores", "ErrorLogger"]