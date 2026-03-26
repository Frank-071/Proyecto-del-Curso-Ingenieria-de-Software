from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from app.repositories.auditoria.auditoria_repository import AuditoriaRepository
from app.schemas.auditoria.auditoria_schemas import (
    KPIDashboard,
    DatoMensual,
    TopEvento,
    TopUsuario,
    TopLocal,
    DetalleTransaccion,
    DistribucionCategoria,
    DashboardCompleto
)


class AuditoriaService:
    """Servicio para operaciones de auditoría y reportería"""
    
    def __init__(self, db: AsyncSession):
        self.repository = AuditoriaRepository(db)
    
    def _validar_fechas(
        self,
        fecha_desde: Optional[datetime],
        fecha_hasta: Optional[datetime]
    ) -> tuple[Optional[datetime], Optional[datetime]]:
        """Valida y ajusta las fechas si es necesario"""
        
        # Si no se proporciona fecha_hasta, usar la fecha actual
        if fecha_hasta is None:
            fecha_hasta = datetime.now()
        
        # Si no se proporciona fecha_desde, usar 1 año atrás
        if fecha_desde is None:
            fecha_desde = fecha_hasta - timedelta(days=365)
        
        # Validar que fecha_desde no sea mayor que fecha_hasta
        if fecha_desde > fecha_hasta:
            raise ValueError("La fecha de inicio no puede ser mayor que la fecha de fin")
        
        return fecha_desde, fecha_hasta
    
    async def get_all_dashboard(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict:
        """
        Obtiene todos los datos del dashboard
        
        Returns:
            Dict con estructura de respuesta estándar
        """
        try:
            fecha_desde, fecha_hasta = self._validar_fechas(fecha_desde, fecha_hasta)
            
            # Obtener KPIs
            kpis_data = await self.repository.obtener_kpis_dashboard(
                evento_id, fecha_desde, fecha_hasta
            )
            kpis = KPIDashboard(**kpis_data)
            
            # Obtener datos mensuales
            datos_mensuales_data = await self.repository.obtener_datos_mensuales(
                evento_id, fecha_desde, fecha_hasta
            )
            datos_mensuales = [DatoMensual(**d) for d in datos_mensuales_data]
            
            # Obtener top eventos
            top_eventos_data = await self.repository.obtener_top_eventos(
                fecha_desde, fecha_hasta, limite=5
            )
            top_eventos = [TopEvento(**e) for e in top_eventos_data]
            
            # Obtener top usuarios
            top_usuarios_data = await self.repository.obtener_top_usuarios(
                fecha_desde, fecha_hasta, limite=5
            )
            top_usuarios = [TopUsuario(**u) for u in top_usuarios_data]
            
            # Obtener top locales
            top_locales_data = await self.repository.obtener_top_locales(
                fecha_desde, fecha_hasta, limite=5
            )
            top_locales = [TopLocal(**l) for l in top_locales_data]
            
            # Obtener distribución de categorías
            distribucion_data = await self.repository.obtener_distribucion_categorias(
                fecha_desde, fecha_hasta
            )
            distribucion = [DistribucionCategoria(**d) for d in distribucion_data]
            
            dashboard = DashboardCompleto(
                kpis=kpis,
                datos_mensuales=datos_mensuales,
                top_eventos=top_eventos,
                top_usuarios=top_usuarios,
                top_locales=top_locales,
                distribucion_categorias=distribucion
            )
            
            return {
                "success": True,
                "message": "Dashboard obtenido exitosamente",
                "data": dashboard.model_dump()
            }
            
        except ValueError as e:
            return {
                "success": False,
                "message": str(e),
                "data": None
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al obtener el dashboard: {str(e)}",
                "data": None
            }
    
    async def get_kpis(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict:
        """Obtiene solo los KPIs principales"""
        try:
            fecha_desde, fecha_hasta = self._validar_fechas(fecha_desde, fecha_hasta)
            
            kpis_data = await self.repository.obtener_kpis_dashboard(
                evento_id, fecha_desde, fecha_hasta
            )
            kpis = KPIDashboard(**kpis_data)
            
            return {
                "success": True,
                "message": "KPIs obtenidos exitosamente",
                "data": kpis.model_dump()
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al obtener KPIs: {str(e)}",
                "data": None
            }
    
    async def get_tendencias(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict:
        """Obtiene datos de tendencias mensuales"""
        try:
            fecha_desde, fecha_hasta = self._validar_fechas(fecha_desde, fecha_hasta)
            
            datos_mensuales_data = await self.repository.obtener_datos_mensuales(
                evento_id, fecha_desde, fecha_hasta
            )
            datos_mensuales = [DatoMensual(**d) for d in datos_mensuales_data]
            
            return {
                "success": True,
                "message": "Tendencias obtenidas exitosamente",
                "data": [d.model_dump() for d in datos_mensuales]
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al obtener tendencias: {str(e)}",
                "data": None
            }
    
    async def get_rankings(
        self,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        limite: int = 10
    ) -> Dict:
        """Obtiene los rankings (top eventos, usuarios y locales)"""
        try:
            fecha_desde, fecha_hasta = self._validar_fechas(fecha_desde, fecha_hasta)
            
            # Top eventos
            top_eventos_data = await self.repository.obtener_top_eventos(
                fecha_desde, fecha_hasta, limite
            )
            top_eventos = [TopEvento(**e) for e in top_eventos_data]
            
            # Top usuarios
            top_usuarios_data = await self.repository.obtener_top_usuarios(
                fecha_desde, fecha_hasta, limite
            )
            top_usuarios = [TopUsuario(**u) for u in top_usuarios_data]
            
            # Top locales
            top_locales_data = await self.repository.obtener_top_locales(
                fecha_desde, fecha_hasta, limite
            )
            top_locales = [TopLocal(**l) for l in top_locales_data]
            
            return {
                "success": True,
                "message": "Rankings obtenidos exitosamente",
                "data": {
                    "top_eventos": [e.model_dump() for e in top_eventos],
                    "top_usuarios": [u.model_dump() for u in top_usuarios],
                    "top_locales": [l.model_dump() for l in top_locales]
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al obtener rankings: {str(e)}",
                "data": None
            }
    
    async def get_detalle_transacciones(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict:
        """Obtiene el detalle de transacciones"""
        try:
            fecha_desde, fecha_hasta = self._validar_fechas(fecha_desde, fecha_hasta)
            
            detalle_data = await self.repository.obtener_detalle_transacciones(
                evento_id, fecha_desde, fecha_hasta
            )
            detalle = [DetalleTransaccion(**d) for d in detalle_data]
            
            return {
                "success": True,
                "message": "Detalle de transacciones obtenido exitosamente",
                "data": [d.model_dump() for d in detalle]
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al obtener detalle de transacciones: {str(e)}",
                "data": None
            }
    
    @staticmethod
    async def registrar_evento(
        db: AsyncSession,
        administrador_id: int,
        tipo_evento: 'TipoEvento',
        entidad_afectada: 'EntidadAfectada',
        entidad_id: int,
        estado_anterior: Optional[Dict[str, Any]] = None,
        estado_nuevo: Optional[Dict[str, Any]] = None
    ) -> 'AuditoriaEvento':
        """
        Registra un evento de auditoría en la base de datos.
        
        Args:
            db: Sesión de base de datos
            administrador_id: ID del administrador responsable
            tipo_evento: Tipo de operación (CREATE, UPDATE, DELETE)
            entidad_afectada: Tipo de entidad (EVENTO, LOCAL, etc.)
            entidad_id: ID del registro afectado
            estado_anterior: Estado antes del cambio (para UPDATE/DELETE)
            estado_nuevo: Estado después del cambio (para CREATE/UPDATE)
        """
        from app.models.auditoria.auditoria_evento import AuditoriaEvento
        
        auditoria = AuditoriaEvento(
            administrador_id=administrador_id,
            tipo_evento=tipo_evento,
            entidad_afectada=entidad_afectada,
            entidad_id=entidad_id,
            estado_anterior=estado_anterior,
            estado_nuevo=estado_nuevo
        )
        
        db.add(auditoria)
        await db.commit()
        await db.refresh(auditoria)
        
        return auditoria
    
    @staticmethod
    def serializar_objeto(obj: Any) -> Optional[Dict[str, Any]]:
        """
        Convierte un objeto SQLAlchemy a diccionario para almacenar en JSON.
        """
        print(f"[DEBUG] Serializando objeto: {obj} (tipo: {type(obj)})")
        if obj is None:
            print("[DEBUG] Objeto es None")
            return None
            
        # Si el objeto tiene el método dict() (como en los modelos Pydantic)
        if hasattr(obj, 'dict'):
            print("[DEBUG] Usando método dict() del objeto")
            return obj.dict()
        
        # Si es un modelo SQLAlchemy
        if hasattr(obj, '__table__'):
            print(f"[DEBUG] Es modelo SQLAlchemy con tabla: {obj.__table__.name}")
            result = {}
            
            # Usar inspección de SQLAlchemy para obtener los valores
            from sqlalchemy import inspect
            mapper = inspect(obj.__class__)
            
            for column in mapper.columns:
                try:
                    # Obtener el valor usando el atributo Python (no el nombre de columna)
                    value = getattr(obj, column.key)
                    # Convertir datetime a string para JSON
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    # Convertir Decimal a float para JSON
                    elif hasattr(value, '__float__'):
                        value = float(value)
                    # Usar el nombre de la columna en BD como key
                    result[column.name] = value
                except AttributeError:
                    print(f"[DEBUG] No se pudo obtener atributo {column.key} para columna {column.name}")
                    result[column.name] = None
                    
            print(f"[DEBUG] Resultado serialización: {result}")
            return result
        
        # Para otros tipos de objetos
        print("[DEBUG] Usando conversión genérica")
        return dict(obj) if isinstance(obj, dict) else str(obj)

    async def get_datos_exportacion(
        self,
        evento_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict:
        """
        Obtiene TODOS los datos para exportación sin límites.
        Incluye detalle de transacciones y rankings completos.
        """
        try:
            fecha_desde, fecha_hasta = self._validar_fechas(fecha_desde, fecha_hasta)
            
            # Obtener KPIs
            kpis_data = await self.repository.obtener_kpis_dashboard(
                evento_id, fecha_desde, fecha_hasta
            )
            kpis = KPIDashboard(**kpis_data)
            
            # Obtener datos mensuales (sin límite)
            datos_mensuales_data = await self.repository.obtener_datos_mensuales(
                evento_id, fecha_desde, fecha_hasta
            )
            datos_mensuales = [DatoMensual(**d) for d in datos_mensuales_data]
            
            # Obtener TODOS los eventos (límite alto)
            top_eventos_data = await self.repository.obtener_top_eventos(
                fecha_desde, fecha_hasta, limite=10000
            )
            top_eventos = [TopEvento(**e) for e in top_eventos_data]
            
            # Obtener TODOS los usuarios (límite alto)
            top_usuarios_data = await self.repository.obtener_top_usuarios(
                fecha_desde, fecha_hasta, limite=10000
            )
            top_usuarios = [TopUsuario(**u) for u in top_usuarios_data]
            
            # Obtener TODOS los locales (límite alto)
            top_locales_data = await self.repository.obtener_top_locales(
                fecha_desde, fecha_hasta, limite=10000
            )
            top_locales = [TopLocal(**l) for l in top_locales_data]
            
            # Obtener distribución de categorías
            distribucion_data = await self.repository.obtener_distribucion_categorias(
                fecha_desde, fecha_hasta
            )
            distribucion = [DistribucionCategoria(**d) for d in distribucion_data]
            
            # Obtener DETALLE de transacciones
            detalle_data = await self.repository.obtener_detalle_transacciones(
                evento_id, fecha_desde, fecha_hasta
            )
            detalle = [DetalleTransaccion(**d) for d in detalle_data]
            
            return {
                "success": True,
                "message": "Datos de exportación obtenidos exitosamente",
                "data": {
                    "kpis": kpis.model_dump(),
                    "datos_mensuales": [d.model_dump() for d in datos_mensuales],
                    "eventos": [e.model_dump() for e in top_eventos],
                    "usuarios": [u.model_dump() for u in top_usuarios],
                    "locales": [l.model_dump() for l in top_locales],
                    "categorias": [c.model_dump() for c in distribucion],
                    "transacciones": [t.model_dump() for t in detalle]
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al obtener datos de exportación: {str(e)}",
                "data": None
            }
