from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional, Union, List
import json
from app.utils.sanitizer import sanitize_text


# Schemas anidados para relaciones
class DepartamentoNested(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    departamento_id: int = Field(alias="id")
    nombre: str


class ProvinciaNested(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    provincia_id: int = Field(alias="id")
    nombre: str
    departamento_id: int
    departamento: Optional[DepartamentoNested] = None


class DistritoNested(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    distrito_id: int = Field(alias="id")
    nombre: str
    provincia_id: int
    provincia: Optional[ProvinciaNested] = None


class LocalNested(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    local_id: int = Field(alias="id")
    nombre: str
    direccion: Optional[str] = None
    distrito_id: int
    distrito: Optional[DistritoNested] = None


class OrganizadorNested(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    organizador_id: int = Field(alias="id")
    nombre: Optional[str] = None


class CategoriaEventoNested(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    categoria_evento_id: int = Field(alias="id")
    nombre: str


class EventoRequest(BaseModel):
    local_id: int = Field(gt=0, description="ID del local debe ser mayor a 0")
    organizador_id: int = Field(gt=0, description="ID del organizador debe ser mayor a 0")
    categoria_evento_id: int = Field(gt=0, description="ID de la categoría debe ser mayor a 0")
    administrador_id: int = Field(gt=0, description="ID del administrador debe ser mayor a 0")
    nombre: str = Field(min_length=1, max_length=50, description="Nombre del evento")
    descripcion: str = Field(min_length=1, max_length=200, description="Descripción del evento")
    fecha_hora_inicio: Union[datetime, str] = Field(description="Fecha y hora de inicio del evento")
    fecha_hora_fin: Union[datetime, str] = Field(description="Fecha y hora de fin del evento")
    es_nominal: bool = Field(description="Indica si el evento requiere nominación")
    estado: str = Field(description="Estado del evento: Borrador, Proximamente, Publicado, Finalizado")
    activo: bool = True
    zonas: Optional[str] = Field(default="[]", description="JSON string con lista de zonas a crear con el evento")

    @field_validator('fecha_hora_inicio', 'fecha_hora_fin', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v
    
    @field_validator('zonas', mode='before')
    @classmethod
    def parse_zonas(cls, v):
        """Parser silencioso - solo normaliza, no valida (validación en service)"""
        if v is None or v == "":
            return "[]"
        
        if isinstance(v, list):
            return json.dumps(v)
        
        if isinstance(v, str):
            return v
        
        return "[]"
    
    @field_validator('nombre', 'descripcion')
    @classmethod
    def sanitize_text_fields(cls, v: str, info) -> str:
        max_len = 50 if info.field_name == 'nombre' else 200
        return sanitize_text(v, max_length=max_len)


class EventoResponse(BaseModel):
    """Schema para listar eventos (sin relaciones pesadas)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    local_id: int
    organizador_id: int
    categoria_evento_id: int
    administrador_id: int
    nombre: str
    descripcion: str
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    es_nominal: bool
    estado: str
    motivo_cancelacion: Optional[str] = None
    activo: bool
    fecha_creacion: Optional[datetime] = None
    icono: Optional[str] = None
    mapa: Optional[str] = None
    banner: Optional[str] = None


class EventoListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nombre: str
    descripcion: str
    fecha_hora_inicio: datetime
    estado: str
    motivo_cancelacion: Optional[str] = None
    categoria_evento_id: int
    local_id: int
    local_nombre: Optional[str] = None
    icono: Optional[str] = None


class EventoPublicResponse(BaseModel):
    """Schema optimizado para página principal - solo datos necesarios"""
    model_config = ConfigDict(from_attributes=True)
    
    evento_id: int = Field(alias="id")
    nombre: str
    descripcion: str
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    es_nominal: bool
    icono_url: Optional[str] = Field(None, alias="icono")
    local_nombre: str
    local_direccion: Optional[str] = None
    categoria_nombre: str


class OrganizadorContactoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None


class EventoDetailResponse(BaseModel):
    """Schema completo para detalle de evento - incluye todas las relaciones"""
    model_config = ConfigDict(from_attributes=True)
    
    # IDs básicos
    evento_id: int = Field(alias="id")
    local_id: int
    organizador_id: int
    categoria_evento_id: int
    
    # Datos del evento
    nombre: str
    descripcion: str
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    es_nominal: bool
    estado: str
    motivo_cancelacion: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    
    # URLs de imágenes
    icono_url: Optional[str] = Field(None, alias="icono")
    mapa_url: Optional[str] = Field(None, alias="mapa")
    
    # Relaciones anidadas completas
    local: Optional[LocalNested] = None
    organizador: Optional[OrganizadorNested] = None
    categoria_evento: Optional[CategoriaEventoNested] = None
    zonas: list = []
