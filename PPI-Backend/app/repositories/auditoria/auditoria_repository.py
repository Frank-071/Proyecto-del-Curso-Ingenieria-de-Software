from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Optional
from datetime import datetime
from decimal import Decimal


class AuditoriaRepository:
    """Repository para consultas de auditoría y reportería"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def obtener_kpis_dashboard(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict:
        """Obtiene los KPIs principales del dashboard"""
        
        query = text("""
            SELECT 
                COALESCE(SUM(p.total), 0) as ventas_totales,
                COALESCE(SUM(dp.cantidad * z.precio), 0) as ventas_estimadas,
                COALESCE(COUNT(DISTINCT e.entrada_id), 0) as tickets_emitidos,
                COALESCE(SUM(CASE WHEN e.fue_transferida = 1 THEN 1 ELSE 0 END), 0) as tickets_transferidos,
                COALESCE(SUM(CASE WHEN e.estado_nominacion = 'Invalida' THEN 1 ELSE 0 END), 0) as incidencias,
                COALESCE(SUM(z.stock_entradas), 0) as stock_total,
                COALESCE(SUM(z.stock_entradas - z.entradas_disponible), 0) as stock_vendido
            FROM Pagos p
            LEFT JOIN DetallesPagos dp ON p.pago_id = dp.pago_id
            LEFT JOIN Zonas z ON dp.zona_id = z.zona_id
            LEFT JOIN Entradas e ON e.pago_detalle_id = dp.pago_detalle_id
            LEFT JOIN Eventos ev ON z.evento_id = ev.evento_id
            WHERE 1=1
                AND (:evento_id IS NULL OR ev.evento_id = :evento_id)
                AND (:fecha_desde IS NULL OR p.fecha_transaccion >= :fecha_desde)
                AND (:fecha_hasta IS NULL OR p.fecha_transaccion <= :fecha_hasta)
        """)
        
        result = await self.db.execute(
            query,
            {
                "evento_id": evento_id,
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta
            }
        )
        
        row = result.fetchone()
        
        if not row:
            return {
                "ventas_totales": Decimal("0"),
                "ventas_estimadas": Decimal("0"),
                "tickets_emitidos": 0,
                "tickets_transferidos": 0,
                "incidencias": 0,
                "tasa_conversion": 0.0,
                "aforo_vendido": 0.0,
                "velocidad_venta": 0.0
            }
        
        ventas_totales = row[0] or Decimal("0")
        ventas_estimadas = row[1] or Decimal("0")
        tickets_emitidos = row[2] or 0
        tickets_transferidos = row[3] or 0
        incidencias = row[4] or 0
        stock_total = row[5] or 0
        stock_vendido = row[6] or 0
        
        # Calcular tasa de conversión
        tasa_conversion = 0.0
        if ventas_estimadas > 0:
            tasa_conversion = float((ventas_totales / ventas_estimadas) * 100)
        
        # Calcular aforo vendido (porcentaje de stock vendido sobre stock total)
        aforo_vendido = 0.0
        if stock_total > 0:
            aforo_vendido = float((stock_vendido / stock_total) * 100)
        
        # Calcular velocidad de venta (tickets por día en últimos 3 meses)
        # Si no se especifican fechas, usar últimos 3 meses
        velocidad_venta = 0.0
        if fecha_desde and fecha_hasta:
            dias_periodo = (fecha_hasta - fecha_desde).days
            if dias_periodo > 0:
                velocidad_venta = float(tickets_emitidos / dias_periodo)
        else:
            # Usar 90 días por defecto (aprox 3 meses)
            velocidad_venta = float(tickets_emitidos / 90)
        
        return {
            "ventas_totales": ventas_totales,
            "ventas_estimadas": ventas_estimadas,
            "tickets_emitidos": tickets_emitidos,
            "tickets_transferidos": tickets_transferidos,
            "incidencias": incidencias,
            "tasa_conversion": round(tasa_conversion, 2),
            "aforo_vendido": round(aforo_vendido, 2),
            "velocidad_venta": round(velocidad_venta, 2)
        }
    
    async def obtener_datos_mensuales(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> List[Dict]:
        """Obtiene datos agrupados por mes"""
        
        query = text("""
            SELECT 
                DATE_FORMAT(p.fecha_transaccion, '%Y-%m') as mes,
                DATE_FORMAT(p.fecha_transaccion, '%b %Y') as mes_nombre,
                COALESCE(SUM(p.total), 0) as ventas,
                COALESCE(SUM(dp.cantidad * z.precio), 0) as ventas_estimadas,
                COALESCE(COUNT(DISTINCT e.entrada_id), 0) as tickets,
                COALESCE(SUM(CASE WHEN e.estado_nominacion = 'Invalida' THEN 1 ELSE 0 END), 0) as incidencias
            FROM Pagos p
            LEFT JOIN DetallesPagos dp ON p.pago_id = dp.pago_id
            LEFT JOIN Zonas z ON dp.zona_id = z.zona_id
            LEFT JOIN Entradas e ON e.pago_detalle_id = dp.pago_detalle_id
            LEFT JOIN Eventos ev ON z.evento_id = ev.evento_id
            WHERE 1=1
                AND (:evento_id IS NULL OR ev.evento_id = :evento_id)
                AND (:fecha_desde IS NULL OR p.fecha_transaccion >= :fecha_desde)
                AND (:fecha_hasta IS NULL OR p.fecha_transaccion <= :fecha_hasta)
            GROUP BY DATE_FORMAT(p.fecha_transaccion, '%Y-%m')
            ORDER BY mes ASC
        """)
        
        result = await self.db.execute(
            query,
            {
                "evento_id": evento_id,
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta
            }
        )
        
        rows = result.fetchall()
        
        return [
            {
                "mes": row[0],
                "mes_nombre": row[1],
                "ventas": row[2] or Decimal("0"),
                "ventas_estimadas": row[3] or Decimal("0"),
                "tickets": row[4] or 0,
                "incidencias": row[5] or 0
            }
            for row in rows
        ]
    
    async def obtener_top_eventos(
        self,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        limite: int = 10
    ) -> List[Dict]:
        """Obtiene el top de eventos por ventas"""
        
        query = text("""
            SELECT 
                ev.evento_id as id,
                COALESCE(ev.nombre, 'Evento sin nombre') as nombre,
                COALESCE(SUM(p.total), 0) as ventas,
                COALESCE(COUNT(DISTINCT e.entrada_id), 0) as tickets
            FROM Eventos ev
            LEFT JOIN Zonas z ON ev.evento_id = z.evento_id
            LEFT JOIN DetallesPagos dp ON z.zona_id = dp.zona_id
            LEFT JOIN Pagos p ON dp.pago_id = p.pago_id
            LEFT JOIN Entradas e ON e.pago_detalle_id = dp.pago_detalle_id
            WHERE 1=1
                AND (:fecha_desde IS NULL OR p.fecha_transaccion >= :fecha_desde)
                AND (:fecha_hasta IS NULL OR p.fecha_transaccion <= :fecha_hasta)
            GROUP BY ev.evento_id, ev.nombre
            HAVING ventas > 0
            ORDER BY ventas DESC
            LIMIT :limite
        """)
        
        result = await self.db.execute(
            query,
            {
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta,
                "limite": limite
            }
        )
        
        rows = result.fetchall()
        
        return [
            {
                "id": row[0],
                "nombre": row[1],
                "ventas": row[2] or Decimal("0"),
                "tickets": row[3] or 0
            }
            for row in rows
        ]
    
    async def obtener_top_usuarios(
        self,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        limite: int = 10
    ) -> List[Dict]:
        """Obtiene el top de usuarios por compras"""
        
        query = text("""
            SELECT 
                c.cliente_id as id,
                COALESCE(CONCAT(u.nombres, ' ', u.apellidos), u.email, 'Usuario sin nombre') as nombre_completo,
                COALESCE(u.email, 'Sin email') as email,
                COALESCE(SUM(p.total), 0) as total_compras,
                COUNT(DISTINCT p.pago_id) as cantidad_compras,
                COALESCE(r.nombre, 'Sin rango') as rango_nombre,
                COALESCE(c.puntos_disponibles, 0) as puntos_disponibles
            FROM Clientes c
            INNER JOIN Usuarios u ON c.cliente_id = u.usuario_id
            LEFT JOIN Rangos r ON c.rango_id = r.rango_id
            LEFT JOIN Pagos p ON c.cliente_id = p.cliente_id
            WHERE 1=1
                AND (:fecha_desde IS NULL OR p.fecha_transaccion >= :fecha_desde)
                AND (:fecha_hasta IS NULL OR p.fecha_transaccion <= :fecha_hasta)
            GROUP BY c.cliente_id, u.nombres, u.apellidos, u.email, r.nombre, c.puntos_disponibles
            HAVING total_compras > 0
            ORDER BY total_compras DESC
            LIMIT :limite
        """)
        
        result = await self.db.execute(
            query,
            {
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta,
                "limite": limite
            }
        )
        
        rows = result.fetchall()
        
        return [
            {
                "id": row[0],
                "nombre_completo": row[1],
                "email": row[2],
                "total_compras": row[3] or Decimal("0"),
                "cantidad_compras": row[4] or 0,
                "rango_nombre": row[5] or "Sin rango",
                "puntos_disponibles": row[6] or 0
            }
            for row in rows
        ]
    
    async def obtener_top_locales(
        self,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        limite: int = 10
    ) -> List[Dict]:
        """Obtiene el top de locales por ingresos"""
        
        query = text("""
            SELECT 
                l.local_id as id,
                COALESCE(l.nombre, 'Local sin nombre') as nombre,
                COALESCE(l.direccion, 'Sin dirección') as direccion,
                COALESCE(SUM(p.total), 0) as total_ingresos,
                COUNT(DISTINCT ev.evento_id) as cantidad_eventos
            FROM Locales l
            LEFT JOIN Eventos ev ON l.local_id = ev.local_id
            LEFT JOIN Zonas z ON ev.evento_id = z.evento_id
            LEFT JOIN DetallesPagos dp ON z.zona_id = dp.zona_id
            LEFT JOIN Pagos p ON dp.pago_id = p.pago_id
            WHERE 1=1
                AND (:fecha_desde IS NULL OR p.fecha_transaccion >= :fecha_desde)
                AND (:fecha_hasta IS NULL OR p.fecha_transaccion <= :fecha_hasta)
            GROUP BY l.local_id, l.nombre, l.direccion
            HAVING total_ingresos > 0
            ORDER BY total_ingresos DESC
            LIMIT :limite
        """)
        
        result = await self.db.execute(
            query,
            {
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta,
                "limite": limite
            }
        )
        
        rows = result.fetchall()
        
        return [
            {
                "id": row[0],
                "nombre": row[1],
                "direccion": row[2],
                "total_ingresos": row[3] or Decimal("0"),
                "cantidad_eventos": row[4] or 0
            }
            for row in rows
        ]
    
    async def obtener_detalle_transacciones(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> List[Dict]:
        """Obtiene el detalle de transacciones"""
        
        query = text("""
            SELECT 
                p.pago_id,
                c.cliente_id,
                COALESCE(CONCAT(u.nombres, ' ', u.apellidos), u.email, 'Usuario sin nombre') as cliente_nombre,
                ev.evento_id,
                COALESCE(ev.nombre, 'Evento sin nombre') as evento_nombre,
                p.fecha_transaccion,
                COALESCE(p.total, 0) as total,
                CASE 
                    WHEN p.metodo_pago_id = 1 THEN 'Tarjeta'
                    WHEN p.metodo_pago_id = 2 THEN 'Yape/Plin'
                    ELSE 'Otro'
                END as metodo_pago,
                COALESCE(SUM(dp.cantidad), 0) as cantidad_tickets
            FROM Pagos p
            INNER JOIN Clientes c ON p.cliente_id = c.cliente_id
            INNER JOIN Usuarios u ON c.cliente_id = u.usuario_id
            INNER JOIN DetallesPagos dp ON p.pago_id = dp.pago_id
            INNER JOIN Zonas z ON dp.zona_id = z.zona_id
            INNER JOIN Eventos ev ON z.evento_id = ev.evento_id
            WHERE 1=1
                AND (:evento_id IS NULL OR ev.evento_id = :evento_id)
                AND (:fecha_desde IS NULL OR p.fecha_transaccion >= :fecha_desde)
                AND (:fecha_hasta IS NULL OR p.fecha_transaccion <= :fecha_hasta)
            GROUP BY p.pago_id, c.cliente_id, u.nombres, u.apellidos, 
                     ev.evento_id, ev.nombre, p.fecha_transaccion, p.total, p.metodo_pago_id
            ORDER BY p.fecha_transaccion DESC
        """)
        
        result = await self.db.execute(
            query,
            {
                "evento_id": evento_id,
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta
            }
        )
        
        rows = result.fetchall()
        
        return [
            {
                "pago_id": row[0],
                "cliente_id": row[1],
                "cliente_nombre": row[2],
                "evento_id": row[3],
                "evento_nombre": row[4],
                "fecha_transaccion": row[5],
                "total": row[6] or Decimal("0"),
                "metodo_pago": row[7],
                "cantidad_tickets": row[8] or 0
            }
            for row in rows
        ]
    
    async def obtener_distribucion_categorias(
        self,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> List[Dict]:
        """Obtiene la distribución de ventas por categoría de evento para gráfico circular"""
        
        # Query combinada que obtiene solo categorías con ventas en el período
        query = text("""
            SELECT 
                ce.categoria_evento_id,
                COALESCE(ce.nombre, 'Categoría sin nombre') as categoria_nombre,
                COALESCE(SUM(p.total), 0) as total_ventas,
                COUNT(DISTINCT ev.evento_id) as cantidad_eventos,
                -- Calcular porcentaje usando ventana para total
                COALESCE(
                    (SUM(p.total) * 100.0) / NULLIF(SUM(SUM(p.total)) OVER (), 0),
                    0
                ) as porcentaje
            FROM CategoriaEvento ce
            INNER JOIN Eventos ev ON ce.categoria_evento_id = ev.categoria_evento_id
            INNER JOIN Zonas z ON ev.evento_id = z.evento_id
            INNER JOIN DetallesPagos dp ON z.zona_id = dp.zona_id
            INNER JOIN Pagos p ON dp.pago_id = p.pago_id
            WHERE 1=1
                AND (:fecha_desde IS NULL OR p.fecha_transaccion >= :fecha_desde)
                AND (:fecha_hasta IS NULL OR p.fecha_transaccion <= :fecha_hasta)
            GROUP BY ce.categoria_evento_id, ce.nombre
            HAVING total_ventas > 0
            ORDER BY total_ventas DESC
        """)
        
        result = await self.db.execute(
            query,
            {
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta
            }
        )
        
        rows = result.fetchall()
        
        return [
            {
                "categoria_id": row[0],
                "categoria_nombre": row[1],
                "total_ventas": row[2] or Decimal("0"),
                "cantidad_eventos": row[3] or 0,
                "porcentaje": float(row[4] or 0)
            }
            for row in rows
        ]
