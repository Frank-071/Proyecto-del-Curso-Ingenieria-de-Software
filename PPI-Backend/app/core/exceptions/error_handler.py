from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from .definitions import BusinessError, AuthenticationError, AuthorizationError, TokenError, ServiceError, ValidationError
import logging
import re

logger = logging.getLogger(__name__)


class ErrorHandler:
    @staticmethod
    async def handle_value_error(request: Request, exc: ValueError) -> JSONResponse:
        """Maneja errores de datos del Repository (404)"""
        logger.warning(f"404 - {request.method} {request.url.path} | {str(exc)} | IP: {request.client.host}")
        return JSONResponse(
            status_code=404,
            content={"detail": str(exc)}
        )
    
    @staticmethod
    async def handle_business_error(request: Request, exc: BusinessError) -> JSONResponse:
        """Maneja errores de lógica de negocio del Service"""
        logger.warning(f"{exc.status_code} - {request.method} {request.url.path} | {exc.message} | IP: {request.client.host}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
    
    @staticmethod
    async def handle_integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
        """Maneja errores de integridad de BD"""
        error_msg = str(exc.orig).lower()
        
        if "data too long" in error_msg:
            match = re.search(r"for column '([^']+)'", error_msg)
            field_name = match.group(1) if match else "desconocido"
            
            logger.warning(f"400 - {request.method} {request.url.path} | Data too long: {field_name} | IP: {request.client.host}")
            return JSONResponse(
                status_code=400,
                content={"detail": f"Campo '{field_name}': excede la longitud máxima permitida"}
            )
        
        logger.error(f"409 - {request.method} {request.url.path} | Integrity constraint violation | IP: {request.client.host}")
        return JSONResponse(
            status_code=409,
            content={"detail": "Conflicto de datos: registro duplicado o restricción violada"}
        )
    
    @staticmethod
    async def handle_sqlalchemy_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        """Maneja errores generales de SQLAlchemy"""
        logger.error(f"500 - {request.method} {request.url.path} | Database error: {type(exc).__name__} | IP: {request.client.host}")
        logger.error(f"Full error: {str(exc)}")
        logger.error(f"Error details: {exc.__dict__}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno de base de datos"}
        )
    
    @staticmethod
    async def handle_authentication_error(request: Request, exc: AuthenticationError) -> JSONResponse:
        """Maneja errores de autenticación (401)"""
        logger.warning(
            f"SECURITY | AUTH_ERROR | Path: {request.url.path} | "
            f"Method: {request.method} | IP: {request.client.host} | "
            f"Error: {exc.message}"
        )
        return JSONResponse(
            status_code=401,
            content={"detail": exc.message}
        )
    
    @staticmethod
    async def handle_authorization_error(request: Request, exc: AuthorizationError) -> JSONResponse:
        """Maneja errores de autorización (403)"""
        logger.warning(
            f"SECURITY | AUTHZ_ERROR | Path: {request.url.path} | "
            f"Method: {request.method} | IP: {request.client.host} | "
            f"Error: {exc.message}"
        )
        return JSONResponse(
            status_code=403,
            content={"detail": exc.message}
        )
    
    @staticmethod
    async def handle_token_error(request: Request, exc: TokenError) -> JSONResponse:
        """Maneja errores de token (401)"""
        logger.warning(
            f"SECURITY | TOKEN_ERROR | Path: {request.url.path} | "
            f"Method: {request.method} | IP: {request.client.host} | "
            f"Error: {exc.message}"
        )
        return JSONResponse(
            status_code=401,
            content={"detail": exc.message}
        )
    
    @staticmethod
    async def handle_service_error(request: Request, exc: ServiceError) -> JSONResponse:
        """Maneja errores de servicios/infraestructura"""
        logger.error(f"{exc.status_code} - {request.method} {request.url.path} | {exc.message} | IP: {request.client.host}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
    
    @staticmethod
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        """Maneja errores de validación de Pydantic (422)"""
        error_msg = "Datos de entrada inválidos"
        if exc.errors():
            first_error = exc.errors()[0]
            field = " -> ".join(str(x) for x in first_error["loc"])
            error_msg = f"Campo '{field}': {first_error['msg']}"
        
        logger.warning(f"422 - {request.method} {request.url.path} | Validation: {error_msg} | IP: {request.client.host}")
        return JSONResponse(
            status_code=422,
            content={"detail": error_msg}
        )
    
    @staticmethod
    async def handle_type_error(request: Request, exc: TypeError) -> JSONResponse:
        """Maneja errores de tipos (problemas de parámetros incorrectos)"""
        error_msg = "Error de configuración: parámetros incorrectos"
        if "unexpected keyword argument" in str(exc):
            error_msg = "Error de configuración: parámetro no válido en constructor"
        elif "missing" in str(exc) and "required positional argument" in str(exc):
            error_msg = "Error de configuración: faltan parámetros requeridos"
        
        logger.error(f"500 - {request.method} {request.url.path} | TypeError: {str(exc)} | IP: {request.client.host}")
        return JSONResponse(
            status_code=500,
            content={"detail": error_msg}
        )
    
    @staticmethod
    async def handle_validation_error_field(request: Request, exc: ValidationError) -> JSONResponse:
        """Maneja errores de validación de campos (longitud, formato)"""
        detail_msg = exc.message
        if exc.field_name:
            detail_msg = f"Campo '{exc.field_name}': {exc.message}"
        
        logger.warning(f"{exc.status_code} - {request.method} {request.url.path} | Validation: {detail_msg} | IP: {request.client.host}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail_msg}
        )
    
    @staticmethod
    async def handle_generic_error(request: Request, exc: Exception) -> JSONResponse:
        """Maneja errores no contemplados"""
        logger.error(f"500 - {request.method} {request.url.path} | Unhandled: {type(exc).__name__}: {str(exc)} | IP: {request.client.host}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno del servidor"}
        )