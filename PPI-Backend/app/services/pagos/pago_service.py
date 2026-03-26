from typing import List, Dict, Tuple
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.pagos import PagoRepository, DetallePagoRepository
from app.repositories.promociones import PromocionRepository
from app.repositories.eventos import ZonaRepository
from app.schemas.pagos import PagoCompletoRequest, PagoResponse, DetallePagoRequest
from app.core.exceptions import BusinessError
from datetime import datetime
from app.utils.handlers import ResponseHandler
import logging

logger = logging.getLogger(__name__)


class PagoService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.pago_repository = PagoRepository(db)
        self.detalle_pago_repository = DetallePagoRepository(db)
        self.zona_repository = ZonaRepository(db)
        self.promocion_repository = PromocionRepository(db)

    def _calcular_totales_zona(
        self, 
        precio_zona: Decimal, 
        cantidad: int,
        descuento_aplicado: Decimal = Decimal('0'),
        descuento_rango: Decimal = Decimal('0')
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """
        Calcula el subtotal, total_zona e IGV para una zona específica.
        
        Args:
            precio_zona: Precio unitario de la zona
            cantidad: Cantidad de entradas
            descuento_aplicado: Descuento por puntos/promociones ya distribuido para esta zona
            descuento_rango: Descuento por rango ya distribuido para esta zona
            
        Returns:
            Tuple[subtotal, total_zona, igv]
        """
        subtotal = precio_zona * cantidad
        total_zona = subtotal - descuento_aplicado - descuento_rango
        
        # Asegurar que el total no sea negativo
        if total_zona < 0:
            total_zona = Decimal('0')
        
        # IGV es el 18% del total_zona
        igv = total_zona * Decimal('0.18')
        
        return subtotal, total_zona, igv

    def _distribuir_descuento_entre_zonas(
        self, 
        detalles: List[DetallePagoRequest],
        descuento_total: Decimal,
        precios_zonas: Dict[int, Decimal]
    ) -> Dict[int, Decimal]:
        """
        Distribuye el descuento total entre las zonas de forma proporcional.
        
        Args:
            detalles: Lista de detalles del pago
            descuento_total: Descuento total a distribuir
            precios_zonas: Mapa de zona_id -> precio_unitario
            
        Returns:
            Dict con zona_id -> descuento_asignado
        """
        if descuento_total <= 0:
            return {detalle.zona_id: Decimal('0') for detalle in detalles}
        
        # Calcular subtotal por zona
        subtotales_zona = {}
        subtotal_general = Decimal('0')
        
        for detalle in detalles:
            precio_zona = precios_zonas[detalle.zona_id]
            subtotal_zona = precio_zona * detalle.cantidad
            subtotales_zona[detalle.zona_id] = subtotal_zona
            subtotal_general += subtotal_zona
        
        # Distribuir proporcionalmente
        descuentos_asignados = {}
        for zona_id, subtotal_zona in subtotales_zona.items():
            if subtotal_general > 0:
                proporcion = subtotal_zona / subtotal_general
                descuento_asignado = descuento_total * proporcion
            else:
                descuento_asignado = Decimal('0')
            
            descuentos_asignados[zona_id] = descuento_asignado
        
        return descuentos_asignados

    async def crear_pago_completo(
        self,
        cliente_id: int,
        request: PagoCompletoRequest,
        descuento_puntos: Decimal = Decimal('0'),
        descuento_rango: Decimal = Decimal('0'),
        total_puntos_otorgados: int = 0
    ) -> Dict:
        """
        Crea un pago completo con todos sus detalles.
        
        Args:
            cliente_id: ID del cliente
            request: Datos del pago
            descuento_puntos: Descuento total aplicado por puntos
            descuento_rango: Descuento total aplicado por rango
            total_puntos_otorgados: Puntos que ganará el cliente con esta compra
        """
        try:
            # 1. Validar que todas las zonas existan y obtener precios
            precios_zonas = {}
            for detalle in request.detalles:
                zona = await self.zona_repository.get_by_id_all(detalle.zona_id)
                if not zona:
                    raise BusinessError(f"Zona {detalle.zona_id} no encontrada", 404)
                precios_zonas[detalle.zona_id] = zona.precio

            # 2. Distribuir descuentos entre zonas
            descuentos_puntos_zona = self._distribuir_descuento_entre_zonas(
                request.detalles, descuento_puntos, precios_zonas
            )
            descuentos_rango_zona = self._distribuir_descuento_entre_zonas(
                request.detalles, descuento_rango, precios_zonas
            )

            # 3. Calcular total general del pago
            total_pago = Decimal('0')
            detalles_calculados = []
            
            for detalle in request.detalles:
                precio_zona = precios_zonas[detalle.zona_id]
                descuento_puntos_asignado = descuentos_puntos_zona[detalle.zona_id]
                descuento_rango_asignado = descuentos_rango_zona[detalle.zona_id]

                # Calcular descuento por promoción si se indicó promocion_id
                descuento_promocion = Decimal('0')
                if detalle.promocion_id:
                    try:
                        promocion = await self.promocion_repository.get_by_id(detalle.promocion_id)
                    except ValueError:
                        raise BusinessError(f"Promoción con ID {detalle.promocion_id} no encontrada", 400)

                    # Verificar que la promoción esté activa
                    if not getattr(promocion, 'activo', True):
                        raise BusinessError(f"Promoción {detalle.promocion_id} no está activa", 400)

                    # Verificar fechas
                    now = datetime.utcnow()
                    if getattr(promocion, 'fecha_inicio', None) and promocion.fecha_inicio > now:
                        raise BusinessError("Promoción aún no ha comenzado", 400)
                    if getattr(promocion, 'fecha_fin', None) and promocion.fecha_fin < now:
                        raise BusinessError("Promoción expirada", 400)

                    # Verificar que la promoción aplique al evento de la zona si está vinculada
                    zona_obj = await self.zona_repository.get_by_id_all(detalle.zona_id)
                    if promocion.evento_id is not None and zona_obj and getattr(zona_obj, 'evento_id', None) != promocion.evento_id:
                        raise BusinessError("Promoción no aplica para la zona/evento seleccionado", 400)

                    porcentaje = getattr(promocion, 'porcentaje_promocion', None) or Decimal('0')
                    descuento_promocion = (precio_zona * detalle.cantidad) * (Decimal(str(porcentaje)) / Decimal('100'))
                
                subtotal, total_zona, igv = self._calcular_totales_zona(
                    precio_zona=precio_zona,
                    cantidad=detalle.cantidad,
                    descuento_aplicado=descuento_puntos_asignado,
                    descuento_rango=descuento_rango_asignado
                )
                
                descuento_aplicado_total = descuento_puntos_asignado + descuento_promocion

                detalle_calculado = {
                    'zona_id': detalle.zona_id,
                    'promocion_id': detalle.promocion_id,
                    'cantidad': detalle.cantidad,
                    'subtotal': subtotal,
                    'descuento_aplicado': descuento_aplicado_total,
                    'descuento_rango': descuento_rango_asignado,
                    'total_zona': total_zona,
                    'igv': igv
                }
                
                detalles_calculados.append(detalle_calculado)
                total_pago += total_zona

            # 4. Crear el pago principal (sin commit)
            pago_data = {
                'cliente_id': cliente_id,
                'metodo_pago_id': request.metodo_pago_id,
                'total': total_pago,
                'total_puntos_otorgados': total_puntos_otorgados
            }
            
            pago_creado = await self.pago_repository.create_sin_commit(pago_data)
            
            # 5. Crear los detalles del pago (sin commit)
            for detalle_calc in detalles_calculados:
                detalle_calc['pago_id'] = pago_creado.id
            
            detalles_creados = await self.detalle_pago_repository.create_bulk_sin_commit(detalles_calculados)
            
            logger.info(f"Pago creado exitosamente: ID={pago_creado.id}, Cliente={cliente_id}, Total={total_pago}")
            
            return {
                'pago_id': pago_creado.id,
                'total': total_pago,
                'detalles_ids': [detalle.id for detalle in detalles_creados]
            }
            
        except BusinessError:
            raise
        except Exception as e:
            logger.error(f"Error al crear pago completo para cliente {cliente_id}: {str(e)}")
            raise BusinessError("Error interno al procesar el pago", 500)

    async def get_pago_by_id(self, pago_id: int) -> Dict:
        """Obtiene un pago específico con todos sus detalles"""
        try:
            pago = await self.pago_repository.get_with_detalles(pago_id)
            if not pago:
                raise BusinessError("Pago no encontrado", 404)
            
            pago_response = PagoResponse.model_validate(pago)
            return ResponseHandler.success_single(pago_response.model_dump(), "Pago obtenido exitosamente")
            
        except BusinessError:
            raise
        except Exception as e:
            logger.error(f"Error al obtener pago {pago_id}: {str(e)}")
            raise BusinessError("Error interno al obtener el pago", 500)

    async def get_pagos_cliente(self, cliente_id: int) -> Dict:
        """Obtiene todos los pagos de un cliente"""
        try:
            pagos = await self.pago_repository.get_by_cliente_id(cliente_id)
            pagos_response = [PagoResponse.model_validate(pago).model_dump() for pago in pagos]
            return ResponseHandler.success_list(pagos_response, "Pagos del cliente obtenidos exitosamente")
            
        except Exception as e:
            logger.error(f"Error al obtener pagos del cliente {cliente_id}: {str(e)}")
            raise BusinessError("Error interno al obtener los pagos", 500)