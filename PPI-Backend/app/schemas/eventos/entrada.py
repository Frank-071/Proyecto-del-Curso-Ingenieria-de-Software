from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class EventoNestedForEntrada(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    evento_id: int = Field(alias="id")
    nombre: str
    fecha_hora_inicio: Optional[datetime] = None
    fecha_hora_fin: Optional[datetime] = None
    estado: Optional[str] = None
    local_id: Optional[int] = None
    icono: Optional[str] = Field(None, alias="icono")


class ZonaNestedForEntrada(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    zona_id: int = Field(alias="id")
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    evento: Optional[EventoNestedForEntrada] = None


class EntradaRequest(BaseModel):
    cliente_id: int = Field(gt=0, description="ID del cliente debe ser mayor a 0")
    zona_id: int = Field(gt=0, description="ID de la zona debe ser mayor a 0")
    codigo_qr: Optional[str] = Field(None, max_length=255, description="Código QR de la entrada")
    fue_transferida: bool = False
    estado_nominacion: str = Field(max_length=20, description="Estado: Pendiente, Valida, Invalida")
    nombres_nominado: Optional[str] = Field(None, max_length=60, description="Nombres del nominado")
    apellidos_nominado: Optional[str] = Field(None, max_length=60, description="Apellidos del nominado")
    numero_documento_nominado: Optional[str] = Field(None, max_length=12, description="Documento del nominado")
    escaneada: bool = False
    fecha_escaneo: Optional[datetime] = None
    puntos_generados: int = Field(description="Puntos generados por la entrada")

class EntradaResponse(BaseModel):
    """Schema completo para entradas"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    cliente_id: int
    zona_id: int
    codigo_qr: Optional[str] = None
    fue_transferida: bool
    fecha_creacion: Optional[datetime] = None
    estado_nominacion: str
    escaneada: bool
    fecha_escaneo: Optional[datetime] = None
    nombres_nominado: Optional[str] = None
    apellidos_nominado: Optional[str] = None
    numero_documento_nominado: Optional[str] = None
    puntos_generados: int


class EntradaListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    zona_id: int
    fecha_creacion: Optional[datetime] = None
    fue_transferida: bool
    total_zona: Optional[Decimal] = None
    fecha_transaccion: Optional[datetime] = None
    zona: Optional[ZonaNestedForEntrada] = None


class EntradaQRResponse(BaseModel):
    """Schema para validación de QR en el evento"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    cliente_id: int
    zona_id: int

    escaneada: bool
    fecha_escaneo: Optional[datetime] = None
    nombres_nominado: Optional[str] = None
    apellidos_nominado: Optional[str] = None



class EntradaNominacionRequest(BaseModel):
    """Schema para nominar una entrada"""
    nombres_nominado: str = Field(min_length=1, max_length=60, description="Nombres del nominado")
    apellidos_nominado: str = Field(min_length=1, max_length=60, description="Apellidos del nominado")
    numero_documento_nominado: str = Field(min_length=1, max_length=12, description="Documento del nominado")


class EntradaBulkResponse(BaseModel):
    """Schema para respuesta de creación bulk de entradas"""
    model_config = ConfigDict(from_attributes=True)
    
    entradas: List[EntradaResponse]
    cantidad: int
    zona_id: int
    precio_total: Decimal


class EntradaBulkMultiItem(BaseModel):
    zona_id: int = Field(gt=0, description="ID de la zona debe ser mayor a 0")
    cantidad: int = Field(gt=0, description="Cantidad de entradas para esta zona")
    precio_unitario: Optional[Decimal] = None
    metadata: Optional[dict] = None


class EntradaBulkMultiRequest(BaseModel):
    # cliente_id se puede omitir si el backend obtiene el cliente desde el token
    cliente_id: Optional[int] = None
    event_id: Optional[int] = None
    total_entradas_checkout: int = Field(ge=1, description="Total de entradas en el checkout")
    descuento_total: float = Field(0.0, ge=0, description="Descuento total aplicado por puntos (monto en S/)")
    puntos_canjeados: int = Field(0, ge=0, description="Cantidad de puntos canjeados por el cliente")
    payment_method: Optional[str] = None  # "card" o "qr"
    metodo_pago_id: Optional[int] = Field(None, ge=1, le=2, description="ID del método de pago (1=tarjeta, 2=Yape/Plin)")
    payment_ref: Optional[str] = None
    descuento_rango: float = Field(0.0, ge=0, description="Descuento total aplicado por rango del usuario (monto en S/)")
    items: List[EntradaBulkMultiItem]


class EntradaBulkMultiResponse(BaseModel):
    success: bool
    entries: Optional[List[EntradaResponse]] = None
    points_remaining: Optional[int] = None
    pago_id: Optional[int] = None
    total_pagado: Optional[float] = None
    message: Optional[str] = None


class EntradaLimiteResponse(BaseModel):
    entradas_compradas: int = Field(ge=0, description="Cantidad de entradas ya compradas para este evento")
    entradas_disponibles: int = Field(ge=0, description="Cantidad de entradas que aún puede comprar")
    limite_alcanzado: bool = Field(description="Indica si ya alcanzó el límite de 4 entradas")

