from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
import re
from app.utils.sanitizer import sanitize_text

class UsuarioRegistro(BaseModel):
    email: EmailStr
    contrasena: str
    numero_documento: str


    @field_validator('contrasena')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

class UsuarioLogin(BaseModel):
    email: EmailStr
    contrasena: str

class UserIdRequest(BaseModel):
    user_id: int

class UsuarioCreate(BaseModel):
    tipo_documento_id: int
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    email: EmailStr
    contrasena: str
    genero: Optional[str] = None
    telefono: Optional[str] = None
    numero_documento: Optional[str] = None
    
    @field_validator('nombres', 'apellidos')
    @classmethod
    def sanitize_names(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v, max_length=50)

class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo_documento_id: int
    nombres: Optional[str]
    apellidos: Optional[str]
    email: EmailStr
    genero: Optional[str]
    telefono: Optional[str]
    numero_documento: Optional[str]
    fecha_creacion: datetime
    fecha_modificacion: Optional[datetime]
    activo: bool

class ProfileResponse(BaseModel):
    """Schema para respuesta de datos de perfil del cliente"""
    model_config = ConfigDict(from_attributes=True)
    
    nombres: Optional[str]
    apellidos: Optional[str]
    email: EmailStr
    genero: Optional[str]
    telefono: Optional[str]
    numero_documento: str
    tipo_documento_nombre: str
    recibir_informacion_eventos: Optional[bool] = True

class ProfileUpdate(BaseModel):
    """Schema para actualizar datos de perfil del cliente"""
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[EmailStr] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    recibir_informacion_eventos: Optional[bool] = None
    
    @field_validator('nombres', 'apellidos')
    @classmethod
    def sanitize_names(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v, max_length=60)
    
    @field_validator('telefono')
    @classmethod
    def validate_telefono(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Validar formato peruano (9 dígitos)
        if not re.match(r'^\d{9}$', v):
            raise ValueError('El teléfono debe tener exactamente 9 dígitos')
        return v
    
    @field_validator('genero')
    @classmethod
    def validate_genero(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_generos = ['Masculino', 'Femenino', 'Prefiero no especificar']
        if v not in valid_generos:
            raise ValueError(f'Género debe ser uno de: {", ".join(valid_generos)}')
        return v

class PasswordChangeRequest(BaseModel):
    """Schema para cambio de contraseña autenticado"""
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

class UsuarioRequest(BaseModel):
    """Schema para solicitudes de usuario no autenticadas"""
    model_config = ConfigDict(from_attributes=True)
    
    nombres: Optional[str]
    apellidos: Optional[str]
    email: EmailStr
    contrasena: Optional[str]
    numero_documento: Optional[str] = None
    telefono: Optional[str] = None
    genero: Optional[str] = None
    
    @field_validator('nombres', 'apellidos')
    @classmethod
    def sanitize_names(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v, max_length=50)
    
    @field_validator('telefono')
    @classmethod
    def validate_telefono(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Validar formato peruano (9 dígitos)
        if not re.match(r'^\d{9}$', v):
            raise ValueError('El teléfono debe tener exactamente 9 dígitos')
        return v
    
    @field_validator('genero')
    @classmethod
    def validate_genero(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_generos = ['Masculino', 'Femenino', 'Prefiero no especificar']
        if v not in valid_generos:
            raise ValueError(f'Género debe ser uno de: {", ".join(valid_generos)}')
        return v
