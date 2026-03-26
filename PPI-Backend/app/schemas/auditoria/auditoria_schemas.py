from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class FiltrosReporteria(BaseModel):
    """Filtros para las consultas de reportería"""
    evento_id: Optional[int] = Field(None, description="ID del evento específico")
    fecha_desde: Optional[datetime] = Field(None, description="Fecha de inicio del rango")
    fecha_hasta: Optional[datetime] = Field(None, description="Fecha de fin del rango")
    limite: Optional[int] = Field(10, description="Límite de resultados para rankings", ge=1, le=100)


class KPIDashboard(BaseModel):
    """KPIs principales del dashboard"""
    ventas_totales: Decimal = Field(..., description="Total de ventas realizadas")
    ventas_estimadas: Decimal = Field(..., description="Total de ventas esperadas (precio lista)")
    tickets_emitidos: int = Field(..., description="Total de tickets emitidos")
    tickets_transferidos: int = Field(..., description="Total de tickets transferidos")
    incidencias: int = Field(..., description="Total de incidencias")
    tasa_conversion: float = Field(..., description="Porcentaje de conversión (puede superar 100%)", ge=0)
    aforo_vendido: float = Field(..., description="Porcentaje de aforo vendido sobre stock total disponible", ge=0)
    velocidad_venta: float = Field(..., description="Promedio de tickets vendidos por día en últimos 3 meses", ge=0)

    class Config:
        from_attributes = True


class DatoMensual(BaseModel):
    """Datos agregados por mes"""
    mes: str = Field(..., description="Mes en formato YYYY-MM")
    mes_nombre: str = Field(..., description="Nombre del mes en formato corto")
    ventas: Decimal = Field(..., description="Ventas del mes")
    ventas_estimadas: Decimal = Field(..., description="Ventas estimadas del mes")
    tickets: int = Field(..., description="Tickets emitidos en el mes")
    incidencias: int = Field(..., description="Incidencias en el mes")

    class Config:
        from_attributes = True


class TopEvento(BaseModel):
    """Top de eventos por ventas"""
    id: int = Field(..., description="ID del evento")
    nombre: str = Field(..., description="Nombre del evento")
    ventas: Decimal = Field(..., description="Total de ventas")
    tickets: int = Field(..., description="Total de tickets vendidos")

    class Config:
        from_attributes = True


class TopUsuario(BaseModel):
    """Top de usuarios por compras"""
    id: int = Field(..., description="ID del cliente")
    nombre_completo: str = Field(..., description="Nombre completo del cliente")
    email: str = Field(..., description="Email del cliente")
    total_compras: Decimal = Field(..., description="Total gastado")
    cantidad_compras: int = Field(..., description="Número de compras realizadas")
    rango_nombre: str = Field(..., description="Nombre del rango del cliente")
    puntos_disponibles: int = Field(..., description="Puntos disponibles del cliente")

    class Config:
        from_attributes = True


class TopLocal(BaseModel):
    """Top de locales por ingresos"""
    id: int = Field(..., description="ID del local")
    nombre: str = Field(..., description="Nombre del local")
    direccion: str = Field(..., description="Dirección del local")
    total_ingresos: Decimal = Field(..., description="Total de ingresos generados")
    cantidad_eventos: int = Field(..., description="Número de eventos realizados")

    class Config:
        from_attributes = True


class DetalleTransaccion(BaseModel):
    """Detalle de una transacción"""
    pago_id: int = Field(..., description="ID del pago")
    cliente_id: int = Field(..., description="ID del cliente")
    cliente_nombre: str = Field(..., description="Nombre del cliente")
    evento_id: int = Field(..., description="ID del evento")
    evento_nombre: str = Field(..., description="Nombre del evento")
    fecha_transaccion: datetime = Field(..., description="Fecha y hora de la transacción")
    total: Decimal = Field(..., description="Total de la transacción")
    metodo_pago: str = Field(..., description="Método de pago utilizado")
    cantidad_tickets: int = Field(..., description="Cantidad de tickets comprados")

    class Config:
        from_attributes = True


class DistribucionCategoria(BaseModel):
    """Distribución de ventas por categoría de evento"""
    categoria_id: int = Field(..., description="ID de la categoría")
    categoria_nombre: str = Field(..., description="Nombre de la categoría")
    total_ventas: Decimal = Field(..., description="Total de ventas de la categoría")
    cantidad_eventos: int = Field(..., description="Cantidad de eventos en la categoría")
    porcentaje: float = Field(..., description="Porcentaje del total (puede superar 100%)", ge=0)

    class Config:
        from_attributes = True


class DashboardCompleto(BaseModel):
    """Respuesta completa del dashboard con todos los datos"""
    kpis: KPIDashboard
    datos_mensuales: List[DatoMensual]
    top_eventos: List[TopEvento]
    top_usuarios: List[TopUsuario]
    top_locales: List[TopLocal]
    distribucion_categorias: List[DistribucionCategoria]

    class Config:
        from_attributes = True
