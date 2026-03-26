class BusinessError(Exception):
    """Excepción para errores de lógica de negocio"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(Exception):
    """Excepción para errores de autenticación (401)"""
    def __init__(self, message: str = "Credenciales inválidas"):
        self.message = message
        super().__init__(self.message)


class AuthorizationError(Exception):
    """Excepción para errores de autorización (403)"""
    def __init__(self, message: str = "No tienes permisos para esta acción"):
        self.message = message
        super().__init__(self.message)


class TokenError(Exception):
    """Excepción para errores de token (401)"""
    def __init__(self, message: str = "Token inválido o expirado"):
        self.message = message
        super().__init__(self.message)


class ValidationError(Exception):
    """Excepción para errores de validación de campos (longitud, formato, etc.)"""
    def __init__(self, message: str, field_name: str = None, status_code: int = 400):
        self.message = message
        self.field_name = field_name
        self.status_code = status_code
        super().__init__(self.message)


class ServiceError(Exception):
    """Excepción para errores de servicios/infraestructura"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)