from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class PagoRequest(BaseModel):
    """Schema para crear un nuevo pago"""
    cliente_id: int = Field(..., gt=0, description="ID del cliente que realiza el pago")
    metodo_pago_id: int = Field(..., ge=1, le=2, description="ID del método de pago (1=tarjeta, 2=Yape/Plin)")
    total: Decimal = Field(..., gt=0, decimal_places=2, description="Total del pago")
    total_puntos_otorgados: int = Field(..., ge=0, description="Total de puntos otorgados por esta compra")


class DetallePagoRequest(BaseModel):
    """Schema para crear un detalle de pago"""
    zona_id: int = Field(..., gt=0, description="ID de la zona")
    promocion_id: Optional[int] = Field(None, description="ID de la promoción aplicada")
    cantidad: int = Field(..., gt=0, description="Cantidad de entradas")
    subtotal: Decimal = Field(..., gt=0, decimal_places=2, description="Subtotal sin descuentos")
    descuento_aplicado: Decimal = Field(0, ge=0, decimal_places=2, description="Descuento aplicado por puntos/promociones")
    descuento_rango: Decimal = Field(0, ge=0, decimal_places=2, description="Descuento por rango del cliente")
    

class PagoCompletoRequest(BaseModel):
    """Schema para crear un pago completo con todos sus detalles"""
    metodo_pago_id: int = Field(..., ge=1, le=2, description="ID del método de pago (1=tarjeta, 2=Yape/Plin)")
    detalles: List[DetallePagoRequest] = Field(..., min_items=1, description="Lista de detalles del pago por zona")


class DetallePagoResponse(BaseModel):
    """Schema de respuesta para detalle de pago"""
    id: int
    pago_id: int
    zona_id: int
    promocion_id: Optional[int]
    cantidad: int
    subtotal: Decimal
    descuento_aplicado: Decimal
    descuento_rango: Decimal
    total_zona: Decimal
    igv: Decimal
    
    class Config:
        from_attributes = True


class PagoResponse(BaseModel):
    """Schema de respuesta para pago"""
    id: int
    cliente_id: int
    metodo_pago_id: int
    fecha_transaccion: datetime
    total: Decimal
    total_puntos_otorgados: int
    detalles_pago: Optional[List[DetallePagoResponse]] = None
    
    class Config:
        from_attributes = True