from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from .error_handler import ErrorHandler
from .definitions import (
    BusinessError, 
    AuthenticationError, 
    AuthorizationError, 
    TokenError,
    ServiceError,
    ValidationError
)


def configure_exception_handlers(app: FastAPI) -> None:
    """    
    Mapeo de excepciones - TODOS los errores usan formato {"detail": "mensaje"}:
    - RequestValidationError: 422 (errores de validación Pydantic)
    - TypeError: 500 (errores de parámetros incorrectos)
    - ValueError: 404 (errores de Repository - datos no encontrados)
    - BusinessError: 400/404 (errores de Service - lógica de negocio)
    - ServiceError: 500 (errores de servicios/infraestructura)
    - AuthenticationError: 401 (credenciales inválidas)
    - AuthorizationError: 403 (sin permisos)
    - TokenError: 401 (token inválido/expirado)
    - IntegrityError: 409 (conflictos de BD)
    - SQLAlchemyError: 500 (errores de base de datos)
    - Exception: 500 (errores no contemplados)
    """
    app.add_exception_handler(RequestValidationError, ErrorHandler.handle_validation_error)
    app.add_exception_handler(TypeError, ErrorHandler.handle_type_error)
    app.add_exception_handler(ValueError, ErrorHandler.handle_value_error)
    app.add_exception_handler(BusinessError, ErrorHandler.handle_business_error)
    app.add_exception_handler(ServiceError, ErrorHandler.handle_service_error)
    app.add_exception_handler(AuthenticationError, ErrorHandler.handle_authentication_error)
    app.add_exception_handler(AuthorizationError, ErrorHandler.handle_authorization_error)
    app.add_exception_handler(TokenError, ErrorHandler.handle_token_error)
    app.add_exception_handler(IntegrityError, ErrorHandler.handle_integrity_error)
    app.add_exception_handler(SQLAlchemyError, ErrorHandler.handle_sqlalchemy_error)
    app.add_exception_handler(ValidationError, ErrorHandler.handle_validation_error_field)
    app.add_exception_handler(Exception, ErrorHandler.handle_generic_error)