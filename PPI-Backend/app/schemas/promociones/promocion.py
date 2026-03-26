from pydantic import BaseModel, Field, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime


class PromocionCreateRequest(BaseModel):
    evento_id: Optional[int] = Field(None, gt=0, description="ID del evento al que aplica la promoción")
    nombre: str = Field(..., min_length=1, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=200)
    porcentaje_promocion: Optional[Decimal] = Field(0, ge=0, le=100, description="Porcentaje de descuento (0-100)")
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    activo: Optional[bool] = True


class PromocionUpdateRequest(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=200)
    porcentaje_promocion: Optional[Decimal] = Field(None, ge=0, le=100)
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    activo: Optional[bool] = None


class PromocionResponse(BaseModel):
    id: int
    evento_id: Optional[int]
    nombre: str
    descripcion: Optional[str]
    porcentaje_promocion: Optional[Decimal] = Field(Decimal("0"))
    fecha_inicio: Optional[datetime]
    fecha_fin: Optional[datetime]
    activo: bool

    @field_validator("porcentaje_promocion", mode="before")
    @classmethod
    def set_default_porcentaje(cls, value: Optional[Decimal]) -> Decimal:
        """Evita errores si la columna llega como NULL desde la base."""
        return Decimal("0") if value is None else value

    class Config:
        from_attributes = True
