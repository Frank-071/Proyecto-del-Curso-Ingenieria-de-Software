from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from typing import Optional


class ZonaCreateRequest(BaseModel):
    """Schema para crear/actualizar zona sin evento_id (se usa al crear/actualizar evento)"""
    id: Optional[int] = Field(None, description="ID de la zona (solo para actualización)")
    nombre: str = Field(min_length=1, max_length=50, description="Nombre de la zona (VIP, General, etc.)")
    descripcion: str = Field(min_length=1, max_length=200, description="Descripción de la zona")
    precio: Decimal = Field(gt=0, decimal_places=2, description="Precio de la entrada en esta zona")
    stock_entradas: int = Field(gt=0, description="Stock total de entradas para esta zona")
    entradas_disponible: int = Field(gt=0, description="Cantidad de entradas disponibles")


class ZonaRequest(BaseModel):
    """Schema para crear/actualizar zona con evento_id"""
    evento_id: int = Field(gt=0, description="ID del evento debe ser mayor a 0")
    nombre: str = Field(min_length=1, max_length=50, description="Nombre de la zona (VIP, General, etc.)")
    descripcion: str = Field(min_length=1, max_length=200, description="Descripción de la zona")
    precio: Decimal = Field(gt=0, decimal_places=2, description="Precio de la entrada en esta zona")
    stock_entradas: int = Field(gt=0, description="Stock total de entradas para esta zona")
    entradas_disponible: int = Field(ge=0, description="Cantidad de entradas disponibles")


class ZonaResponse(BaseModel):
    """Schema completo para zonas"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    evento_id: int
    nombre: str
    descripcion: str
    precio: Decimal
    stock_entradas: int
    entradas_disponible: int


class ZonaListResponse(BaseModel):
    """Schema ligero para listar zonas"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nombre: str
    descripcion: str
    precio: Decimal
    stock_entradas: int


class ZonaDisponibilidadResponse(BaseModel):
    """Schema para consultar disponibilidad rápidamente"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nombre: str
    entradas_disponible: int
    stock_entradas: int
    precio: Decimal

