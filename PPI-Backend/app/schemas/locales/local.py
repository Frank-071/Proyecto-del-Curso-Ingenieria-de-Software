from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional
from app.utils.sanitizer import sanitize_text


class LocalRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=100, description="Nombre del local")
    direccion: str = Field(min_length=1, max_length=255, description="Dirección del local")
    distrito_id: int = Field(gt=0, description="ID del distrito debe ser mayor a 0")
    aforo: int = Field(gt=0, description="Aforo debe ser mayor a 0")
    tipo_local_id: int = Field(gt=0, description="ID del tipo de local debe ser mayor a 0")
    activo: bool = True
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    
    @field_validator('nombre', 'direccion')
    @classmethod
    def sanitize_text_fields(cls, v: str, info) -> str:
        max_len = 100 if info.field_name == 'nombre' else 255
        return sanitize_text(v, max_length=max_len)


class LocalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    distrito_id: int
    nombre: str
    direccion: str
    aforo: int
    tipo_local_id: int
    activo: bool
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

