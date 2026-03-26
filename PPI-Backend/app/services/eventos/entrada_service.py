from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy import update, select
from sqlalchemy.orm import selectinload
from typing import Dict, Callable, Awaitable, List, Tuple
from decimal import Decimal
import logging
from datetime import datetime
import asyncio
from concurrent.futures import ProcessPoolExecutor
from app.repositories.eventos import EntradaRepository, ZonaRepository
from app.schemas.eventos import EntradaRequest, EntradaResponse, EntradaListResponse
from app.utils.handlers import ResponseHandler
from app.core.exceptions import BusinessError
from app.models import Zona, Entrada, RegistroPunto, Cliente
from app.models.eventos.evento import EstadoEventoEnum
from app.services.shared import CacheService, S3Service
from app.services.eventos.notificacion_service import NotificacionService
from app.services.pagos import PagoService
from app.schemas.pagos import PagoCompletoRequest, DetallePagoRequest
from app.utils.email.correo_entradas import build_ticket_images, make_attachment_from_image_bytes
from app.utils.email.email_service import send_email
from app.utils.email.templates import entradas_email_html
from app.utils.pdf.entrada_pdf import generate_entrada_pdf
from app.core.config import settings
from app.core.auditoria import ErrorLogger
from app.models.auditoria.log_error import ModuloSistema
import uuid

logger = logging.getLogger(__name__)


class EntradaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.entrada_repository = EntradaRepository(db)
        self.zona_repository = ZonaRepository(db)
    
    def _handle_integrity_error(self, error: IntegrityError) -> None:
        """Parsea errores de integridad de la BD y lanza BusinessError con mensaje claro"""
        error_msg = str(error.orig).lower()
        
        if "cliente_id" in error_msg or "fk_entradas_clientes" in error_msg:
            raise BusinessError("Cliente no encontrado", 404)
        elif "zona_id" in error_msg or "fk_entradas_zonas" in error_msg:
            raise BusinessError("Zona no encontrada", 404)
        else:
            raise BusinessError("Error de integridad en la base de datos", 500)
    
    def _handle_operational_error(self, error: OperationalError) -> None:
        """Parsea errores operacionales de la BD y lanza BusinessError con mensaje claro"""
        error_msg = str(error.orig)
        
        if "1644" in error_msg and "Suma de zonas excede aforo del local" in error_msg:
            raise BusinessError("No hay suficientes entradas disponibles. El aforo del local ha sido excedido.", 400)
        elif "entradas_disponible" in error_msg.lower():
            raise BusinessError("No hay suficientes entradas disponibles para esta zona", 400)
        else:
            raise BusinessError("Error en la operación de base de datos", 500)
    
    async def get_entradas_cliente(self, cliente_id: int) -> Dict:
        cache_key = f"cliente:entradas:{cliente_id}"
        tag_key = "cache_tags:cliente_entradas"

        async def fetch() -> Dict:
            entradas = await self.entrada_repository.get_by_cliente(cliente_id)
            entradas_response = [EntradaListResponse.model_validate(entrada).model_dump() for entrada in entradas]
            return ResponseHandler.success_list(entradas_response, "Entradas obtenidas exitosamente")

        return await CacheService.get_or_fetch(
            cache_key=cache_key,
            tag_key=tag_key,
            fetch_fn=fetch,
            ttl=settings.CACHE_TTL_CLIENTE_ENTRADAS
        )

    
    async def get_cliente_ticket_summary(self, cliente_id: int) -> Dict:
        """
        Obtiene resumen de tickets del cliente: total y próximo evento.
        Usado por el perfil del cliente.
        """
        stmt = (
            select(Entrada)
            .options(selectinload(Entrada.zona).selectinload(Zona.evento))
            .where(Entrada.cliente_id == cliente_id)
        )
        result = await self.db.execute(stmt)
        entradas = list(result.scalars().all())
        
        total_tickets = sum(1 for entrada in entradas if not entrada.fue_transferida)
        
        now = datetime.utcnow()
        proximos = sorted(
            (
                entrada
                for entrada in entradas
                if (
                    entrada.zona
                    and entrada.zona.evento
                    and entrada.zona.evento.fecha_hora_inicio
                    and entrada.zona.evento.fecha_hora_inicio > now
                    and not entrada.escaneada
                    and not entrada.fue_transferida
                )
            ),
            key=lambda entrada: entrada.zona.evento.fecha_hora_inicio
        )
        
        proximo_evento = None
        if proximos:
            evento = proximos[0].zona.evento
            fecha = evento.fecha_hora_inicio
            proximo_evento = {
                "nombre": evento.nombre,
                "fecha": fecha.strftime("%d/%m/%Y"),
                "hora": fecha.strftime("%H:%M")
            }
        
        return {
            "total_tickets": total_tickets,
            "proximo_evento": proximo_evento
        }
    
    def _calculate_points(self, precio: Decimal, descuento_por_entrada: Decimal = Decimal('0.0')) -> int:
        """
        Calcula puntos basado en el precio con descuento aplicado: 1 punto por cada 5 soles
        
        Args:
            precio: Precio original de la entrada
            descuento_por_entrada: Descuento proporcional aplicado a esta entrada
        
        Returns:
            Puntos calculados (redondeado hacia abajo)
        """
        precio_efectivo = max(precio - descuento_por_entrada, Decimal('0.0'))
        puntos_calculados = int(precio_efectivo // 5)
        logger.debug(f"Puntos calculados: precio={precio}, descuento={descuento_por_entrada}, puntos={puntos_calculados}")
        return puntos_calculados
    
    async def _create_punto_registro_and_update_cliente(self, entrada_id: int, cliente_id: int, precio: Decimal, descuento_por_entrada: Decimal = Decimal('0.0')):
        """Crea registro de puntos y actualiza puntos del cliente (para operaciones individuales)"""
        puntos = self._calculate_points(precio, descuento_por_entrada)
        
        if puntos > 0:
            registro = RegistroPunto(
                cliente_id=cliente_id,
                pago_id=None,
                entrada_id=entrada_id,
                tipo_registro="Aumento",
                cantidad_puntos=puntos,
                fecha_registro=datetime.utcnow()
            )
            self.db.add(registro)
            
            await self.db.execute(
                update(Cliente)
                .where(Cliente.id == cliente_id)
                .values(
                    puntos_disponibles=Cliente.puntos_disponibles + puntos,
                    puntos_historicos=Cliente.puntos_historicos + puntos
                )
            )

    async def _create_points_redemption_registro(self, cliente_id: int, puntos_canjeados: int, pago_id: int = None):
        """
        Crea registro de decremento de puntos por canjeo y actualiza cliente
        
        Args:
            cliente_id: ID del cliente que canjea puntos
            puntos_canjeados: Cantidad de puntos canjeados
            pago_id: ID del pago asociado (opcional)
        """
        if puntos_canjeados > 0:
            registro_decremento = RegistroPunto(
                cliente_id=cliente_id,
                pago_id=pago_id,
                entrada_id=None,
                tipo_registro="Decremento",
                cantidad_puntos=puntos_canjeados,
                fecha_registro=datetime.utcnow()
            )
            self.db.add(registro_decremento)
            
            await self.db.execute(
                update(Cliente)
                .where(Cliente.id == cliente_id)
                .values(
                    puntos_disponibles=Cliente.puntos_disponibles - puntos_canjeados
                )
            )
            logger.info(f"Puntos canjeados registrados: cliente_id={cliente_id}, puntos={puntos_canjeados}")

    async def _bulk_create_punto_registros(self, entradas_con_puntos: list, cliente_id: int, pago_id: int = None) -> int:
        """
        Crea registros de puntos en batch y calcula total de puntos
        
        Args:
            entradas_con_puntos: Lista de tuplas (entrada_id, puntos_calculados)
            cliente_id: ID del cliente
            pago_id: ID del pago asociado (opcional)
        
        Returns:
            Total de puntos acumulados
        """
        registros = []
        total_puntos = 0
        
        for entrada_id, puntos in entradas_con_puntos:
            if puntos > 0:
                registros.append(
                    RegistroPunto(
                        cliente_id=cliente_id,
                        pago_id=pago_id,
                        entrada_id=entrada_id,
                        tipo_registro="Aumento",
                        cantidad_puntos=puntos,
                        fecha_registro=datetime.utcnow()
                    )
                )
                total_puntos += puntos
        
        if registros:
            self.db.add_all(registros)
            logger.info(f"Registros de puntos creados en batch: {len(registros)} registros, total={total_puntos}")
        
        return total_puntos
    
    async def _bulk_update_cliente_puntos(self, cliente_id: int, puntos_ganados: int, puntos_canjeados: int = 0):
        """
        Actualiza puntos del cliente en una sola operación
        
        Args:
            cliente_id: ID del cliente
            puntos_ganados: Puntos totales ganados por las entradas
            puntos_canjeados: Puntos canjeados (se restan)
        """
        puntos_netos = puntos_ganados - puntos_canjeados
        
        await self.db.execute(
            update(Cliente)
            .where(Cliente.id == cliente_id)
            .values(
                puntos_disponibles=Cliente.puntos_disponibles + puntos_netos,
                puntos_historicos=Cliente.puntos_historicos + puntos_ganados
            )
        )
        logger.info(f"Puntos del cliente actualizados: cliente_id={cliente_id}, ganados={puntos_ganados}, canjeados={puntos_canjeados}")

    async def create_entradas_bulk_multi(self, payload, cliente_id: int) -> Dict:
        """
        Crea entradas para múltiples zonas en una sola transacción atómica.
        
        Optimizaciones y garantías:
        - Transacción única (ACID completo): commit único al final
        - Decremento atómico de stock por zona con WHERE condicional
        - Cálculo de puntos una sola vez por entrada
        - Batch insert de RegistroPunto y un solo UPDATE de Cliente
        - SELECT optimizado para respuesta (evita N refreshes)
        - Notificaciones programadas dentro de la transacción
        """
        # Variables para invalidación de cache (fuera de la transacción)
        event_ids = set()
        entrada_ids = []
        
        try:
            items = getattr(payload, 'items', None)
            if not items or len(items) == 0:
                raise BusinessError('No se recibieron items para procesar', 400)

            total_entries = sum(int(getattr(it, 'cantidad', 0)) for it in items)
            if total_entries <= 0:
                raise BusinessError('La cantidad total de entradas debe ser mayor a 0', 400)

            descuento_total = Decimal(str(getattr(payload, 'descuento_total', 0) or 0))
            puntos_canjeados = int(getattr(payload, 'puntos_canjeados', 0) or 0)
            descuento_por_entrada = (descuento_total / Decimal(str(total_entries))) if descuento_total > 0 else Decimal('0.0')

            zona_map = {}
            for it in items:
                zona_id = int(getattr(it, 'zona_id'))
                cantidad = int(getattr(it, 'cantidad'))
                if cantidad <= 0:
                    raise BusinessError(f'Cantidad inválida para zona {zona_id}', 400)

                zona = await self.zona_repository.get_by_id_all(zona_id)
                if not zona:
                    raise BusinessError(f'Zona {zona_id} no encontrada', 404)
                zona_map[zona_id] = zona

                evento = getattr(zona, 'evento', None)
                if not evento:
                    raise BusinessError('El evento asociado a la zona no existe', 404)

                estado_evento = getattr(evento, 'estado', None)
                if estado_evento and estado_evento == EstadoEventoEnum.CANCELADO.value:
                    raise BusinessError('El evento ha sido cancelado. No es posible completar la compra.', 400)

                if hasattr(evento, 'activo') and evento.activo is False:
                    raise BusinessError('El evento se encuentra inactivo. No es posible completar la compra.', 400)
                if getattr(zona, 'evento_id', None):
                    event_ids.add(zona.evento_id)
            
            evento_entradas_map = {}
            for zona_id, zona in zona_map.items():
                evento_id = zona.evento_id
                if evento_id not in evento_entradas_map:
                    evento_entradas_map[evento_id] = 0
            
            for it in items:
                zona_id = int(getattr(it, 'zona_id'))
                cantidad = int(getattr(it, 'cantidad'))
                evento_id = zona_map[zona_id].evento_id
                evento_entradas_map[evento_id] += cantidad
            
            for evento_id, cantidad_nueva in evento_entradas_map.items():
                entradas_existentes = await self.entrada_repository.count_by_cliente_evento(cliente_id, evento_id)
                total_final = entradas_existentes + cantidad_nueva
                
                if total_final > 4:
                    raise BusinessError(
                        f'Ya tienes {entradas_existentes} entrada(s) para este evento. '
                        f'El límite es 4 entradas por evento. No puedes comprar {cantidad_nueva} entrada(s) adicional(es).',
                        400
                    )

            # INICIO DE TRANSACCIÓN ÚNICA
            entradas_creadas = []
            entradas_con_puntos = []
            
            # 2. Actualizar stock por zona de forma atómica
            for it in items:
                zona_id = int(getattr(it, 'zona_id'))
                cantidad = int(getattr(it, 'cantidad'))
                
                # Log para debug
                zona_actual = zona_map[zona_id]
                logger.info(f"Actualizando stock zona {zona_id}: entradas_disponible={zona_actual.entradas_disponible}, cantidad_solicitada={cantidad}")
                
                result = await self.db.execute(
                    update(Zona)
                    .where(Zona.id == zona_id, Zona.entradas_disponible >= cantidad)
                    .values(entradas_disponible=Zona.entradas_disponible - cantidad)
                )
                if result.rowcount == 0:
                    raise BusinessError(f'No hay suficientes entradas disponibles para la zona {zona_id}', 400)

            # 3. Crear entradas con puntos_generados ya calculados y codigo_qr único
            for it in items:
                zona_id = int(getattr(it, 'zona_id'))
                cantidad = int(getattr(it, 'cantidad'))
                zona = zona_map[zona_id]
                for _ in range(cantidad):
                    puntos_calculados = self._calculate_points(zona.precio, descuento_por_entrada)
                    codigo_qr = f"ENT-{uuid.uuid4().hex[:12].upper()}"
                    db_entrada = Entrada(
                        cliente_id=cliente_id,
                        zona_id=zona_id,
                        fue_transferida=False,
                        escaneada=False,
                        estado_nominacion='Pendiente',
                        puntos_generados=puntos_calculados,
                        codigo_qr=codigo_qr
                    )
                    self.db.add(db_entrada)
                    entradas_creadas.append(db_entrada)

            await self.db.flush()

            # Recolectar IDs y puntos tras flush
            for entrada in entradas_creadas:
                entrada_ids.append(entrada.id)
                entradas_con_puntos.append((entrada.id, entrada.puntos_generados))

            # 4. Programar notificaciones (inserción en tabla dentro de la transacción)
            notif_service = NotificacionService(self.db)
            for entrada in entradas_creadas:
                zona = zona_map.get(entrada.zona_id)
                await notif_service.schedule_for_entrada(entrada, cliente_id, zona=zona)

            # 5. Crear registro de pago si se proporciona método de pago (ANTES de registrar puntos)
            pago_id = None
            total_pago = Decimal('0')
            
            metodo_pago_id = getattr(payload, 'metodo_pago_id', None)
            logger.info(f"DEBUG PAGO: metodo_pago_id={metodo_pago_id}, payload={payload}")
            
            if metodo_pago_id:
                logger.info(f"DEBUG PAGO: Iniciando creación de pago para cliente {cliente_id}")
                
                # Determinar método de pago basado en payment_method si metodo_pago_id no está presente
                if not metodo_pago_id:
                    payment_method = getattr(payload, 'payment_method', 'card')
                    metodo_pago_id = 1 if payment_method == 'card' else 2
                
                # Obtener descuento por rango del payload
                descuento_rango_total = Decimal(str(getattr(payload, 'descuento_rango', 0) or 0))
                
                # Preparar detalles del pago por zona
                detalles_pago = []
                for it in items:
                    zona_id = int(getattr(it, 'zona_id'))
                    cantidad = int(getattr(it, 'cantidad'))
                    zona = zona_map[zona_id]
                    
                    detalle_pago = DetallePagoRequest(
                        zona_id=zona_id,
                        cantidad=cantidad,
                        subtotal=zona.precio * cantidad,
                        promocion_id=None
                    )
                    detalles_pago.append(detalle_pago)
                
                # Calcular total de puntos ANTES de crear el pago
                total_puntos = sum(entrada.puntos_generados for entrada in entradas_creadas)
                
                # Crear el request de pago completo
                pago_request = PagoCompletoRequest(
                    metodo_pago_id=metodo_pago_id,
                    detalles=detalles_pago
                )
                
                # Crear pago usando el servicio de pagos
                pago_service = PagoService(self.db)
                resultado_pago = await pago_service.crear_pago_completo(
                    cliente_id=cliente_id,
                    request=pago_request,
                    descuento_puntos=descuento_total,
                    descuento_rango=descuento_rango_total,
                    total_puntos_otorgados=total_puntos
                )
                
                pago_id = resultado_pago['pago_id']
                total_pago = resultado_pago['total']
                detalles_ids = resultado_pago['detalles_ids']
                
                # Actualizar las entradas con el pago_detalle_id correspondiente
                for entrada in entradas_creadas:
                    zona_id_entrada = entrada.zona_id
                    
                    # Buscar en los detalles creados el que corresponde a esta zona
                    for j, detalle in enumerate(detalles_pago):
                        if detalle.zona_id == zona_id_entrada:
                            entrada.pago_detalle_id = detalles_ids[j]
                            break
                
                await self.db.flush()
            else:
                # Si no hay pago, calcular puntos normalmente
                total_puntos = sum(entrada.puntos_generados for entrada in entradas_creadas)
            stmt_cliente = select(Cliente).where(Cliente.id == cliente_id)
            result_cliente = await self.db.execute(stmt_cliente)
            cliente_obj = result_cliente.scalar_one_or_none()
            puntos_anteriores = getattr(cliente_obj, 'puntos_disponibles', 0) if cliente_obj else 0

            await self._bulk_create_punto_registros(entradas_con_puntos, cliente_id, pago_id)

            if puntos_canjeados > 0:
                await self._create_points_redemption_registro(cliente_id, puntos_canjeados, pago_id)

            await self._bulk_update_cliente_puntos(cliente_id, total_puntos, puntos_canjeados)

            points_remaining = puntos_anteriores + total_puntos - puntos_canjeados

            await self.db.commit()
            logger.info(f"Transacción completada: {len(entrada_ids)} entradas creadas para cliente {cliente_id}, pago_id: {pago_id}")

            stmt_entradas = (
                select(Entrada)
                .options(selectinload(Entrada.zona).selectinload(Zona.evento))
                .where(Entrada.id.in_(entrada_ids))
            )
            result_entradas = await self.db.execute(stmt_entradas)
            entradas_finales = list(result_entradas.scalars().all())
            entradas_response = [EntradaResponse.model_validate(e) for e in entradas_finales]
            entries_email_payload = self._build_email_entries_payload(entradas_finales)

            # 12. Invalidar caches (fuera de transacción, fire-and-forget)
            if event_ids:
                CacheService.safe_invalidate_async(
                    CacheService.invalidate_eventos_batch(list(event_ids)), 
                    'entradas_bulk_multi_eventos'
                )
            CacheService.safe_invalidate_async(
                CacheService.invalidate_cliente_perfil(cliente_id), 
                'entradas_bulk_multi_cliente'
            )
            CacheService.safe_invalidate_async(
                CacheService.invalidate_cliente_entradas(cliente_id),
                'entradas_bulk_multi_listado_cliente'
            )

            response_payload = {
                'entries': [e.model_dump() for e in entradas_response],
                'entries_email': entries_email_payload,
                'points_remaining': points_remaining,
                'pago_id': pago_id,
                'total_pagado': float(total_pago) if total_pago else None
            }

            return ResponseHandler.success_create(response_payload, f'{len(entradas_creadas)} entrada(s) creada(s) exitosamente')

        except IntegrityError as e:
            await self.db.rollback()
            self._handle_integrity_error(e)
        except OperationalError as e:
            await self.db.rollback()
            # Registrar el error en el sistema de auditoría
            await ErrorLogger.log_database_error(
                db=self.db,
                modulo=ModuloSistema.ENTRADAS,
                descripcion=f"Error operacional al crear entradas bulk-multi: {str(e)}",
                excepcion=e,
                contexto={"operation": "create_entradas_bulk_multi"}
            )
            self._handle_operational_error(e)
        except BusinessError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creando entradas bulk-multi: {e}")
            raise BusinessError("Error interno al crear entradas", 500)
    
    def _build_email_entries_payload(self, entradas: List[Entrada]) -> List[Dict[str, object]]:
        email_entries: List[Dict[str, object]] = []

        for entrada in entradas:
            zona = getattr(entrada, 'zona', None)
            evento = getattr(zona, 'evento', None) if zona else None

            event_name = getattr(evento, 'nombre', None) or 'Evento PatasPepas'
            event_date = ''
            if evento and getattr(evento, 'fecha_hora_inicio', None):
                event_date = evento.fecha_hora_inicio.strftime("%d/%m/%Y %H:%M")

            zona_nombre = getattr(zona, 'nombre', None) or 'Zona'
            ticket_type = getattr(zona, 'descripcion', None) or zona_nombre
            precio = getattr(zona, 'precio', None)
            price_value = float(precio) if precio is not None else 0.0

            email_entries.append({
                'entradaId': getattr(entrada, 'id', None),
                'eventName': event_name,
                'eventDate': event_date,
                'ticketType': ticket_type,
                'zone': zona_nombre,
                'price': round(price_value, 2),
                'quantity': 1
            })

        return email_entries

    async def enviar_correo_entradas(self, cliente_id: int, email: str, entradas: list) -> dict:
        if not entradas:
            return {"success": False, "detail": "No se recibieron entradas para enviar"}

        try:
            print(f"📧 Preparando envío de entradas a {email}")

            entrada_ids = [e.get('id') if isinstance(e, dict) else e.id for e in entradas]
            
            stmt = (
                select(Entrada)
                .options(
                    selectinload(Entrada.zona).selectinload(Zona.evento)
                )
                .where(Entrada.id.in_(entrada_ids))
            )
            result = await self.db.execute(stmt)
            entradas_db = list(result.scalars().all())
            
            entradas_formateadas = []
            for entrada_db in entradas_db:
                if not entrada_db.zona or not entrada_db.zona.evento:
                    continue
                    
                evento = entrada_db.zona.evento
                entrada_dict = {
                    "id": entrada_db.id,
                    "codigo_qr": entrada_db.codigo_qr or f"ENT-{entrada_db.id}",
                    "eventName": evento.nombre,
                    "eventDate": evento.fecha_hora_inicio.isoformat() if evento.fecha_hora_inicio else "",
                    "zone": entrada_db.zona.nombre,
                    "ticketType": entrada_db.zona.nombre,
                    "quantity": 1,
                    "price": float(entrada_db.zona.precio),
                    "entradasCreadas": entrada_db.codigo_qr or f"ENT-{entrada_db.id}"
                }
                entradas_formateadas.append(entrada_dict)

            if not entradas_formateadas:
                return {"success": False, "detail": "No se pudieron cargar las entradas para el correo"}

            imagenes = build_ticket_images(entradas_formateadas)

            attachments = []
            for filename, bytes_png in imagenes:
                att = make_attachment_from_image_bytes(bytes_png, filename)
                attachments.append(att)

            subject = "🎟️ Tus entradas de ConcertHub"
            
            html_body = entradas_email_html(cliente_id, entradas_formateadas)

            plain_body = "Gracias por tu compra. Tus entradas están adjuntas. Presenta el QR al ingresar."

            await send_email(
                to_email=email,
                subject=subject,
                body=html_body,
                plain_text_body=plain_body,
                attachments=attachments
            )

            print("📨 Correo enviado exitosamente 🚀")
            return {"success": True, "detail": "Correo enviado"}

        except Exception as e:
            print("❌ Error enviando correo:", e)
            logger.error(f"Error enviando correo: {e}", exc_info=True)
            return {"success": False, "detail": str(e)}
    
    async def get_limite_entradas_evento(self, cliente_id: int, evento_id: int) -> Dict:
        entradas_compradas = await self.entrada_repository.count_by_cliente_evento(cliente_id, evento_id)
        entradas_disponibles = max(0, 4 - entradas_compradas)
        limite_alcanzado = entradas_compradas >= 4
        
        return {
            "entradas_compradas": entradas_compradas,
            "entradas_disponibles": entradas_disponibles,
            "limite_alcanzado": limite_alcanzado
        }
    
    async def has_entradas_vendidas_evento(self, evento_id: int) -> Dict:
        tiene_entradas = await self.entrada_repository.has_entradas_vendidas_evento(evento_id)
        return {
            "tiene_entradas": tiene_entradas
        }
    
    async def get_clientes_unicos_evento(self, evento_id: int) -> List[int]:
        return await self.entrada_repository.get_clientes_unicos_evento(evento_id)
    
    async def generate_and_upload_pdfs_background(self, entrada_ids: List[int]):
        from app.models import Evento, Local
        
        logger.info(f"Iniciando generación de PDFs para {len(entrada_ids)} entradas en background con multiproceso")
        pdfs_generados = 0
        pdfs_fallidos = 0
        
        try:
            stmt = (
                select(Entrada)
                .options(
                    selectinload(Entrada.zona).selectinload(Zona.evento).selectinload(Evento.local),
                    selectinload(Entrada.cliente).selectinload(Cliente.usuario)
                )
                .where(Entrada.id.in_(entrada_ids))
            )
            result = await self.db.execute(stmt)
            entradas = list(result.scalars().all())
            
            if not entradas:
                logger.warning(f"No se encontraron entradas para generar PDFs. IDs solicitados: {entrada_ids}")
                return
            
            s3_service = S3Service()
            loop = asyncio.get_event_loop()
            max_workers = min(len(entradas), 4)
            
            async def process_entrada_pdf(entrada: Entrada, executor: ProcessPoolExecutor) -> Tuple[bool, int]:
                try:
                    if not entrada.zona or not entrada.zona.evento:
                        logger.warning(f"Entrada {entrada.id} no tiene zona o evento asociado, omitiendo PDF")
                        return (False, entrada.id)
                    
                    evento = entrada.zona.evento
                    local_nombre = evento.local.nombre if evento.local else "Local no disponible"
                    cliente_nombres = entrada.cliente.usuario.nombres if entrada.cliente and entrada.cliente.usuario else None
                    cliente_apellidos = entrada.cliente.usuario.apellidos if entrada.cliente and entrada.cliente.usuario else None
                    
                    pdf_bytes = await loop.run_in_executor(
                        executor,
                        generate_entrada_pdf,
                        entrada.id,
                        entrada.codigo_qr or f"ENT-{entrada.id}",
                        evento.nombre,
                        evento.fecha_hora_inicio,
                        evento.icono,
                        local_nombre,
                        entrada.zona.nombre,
                        float(entrada.zona.precio),
                        cliente_nombres,
                        cliente_apellidos,
                        entrada.nombres_nominado,
                        entrada.apellidos_nominado
                    )
                    
                    await s3_service.upload_entrada_pdf(pdf_bytes, entrada.id)
                    logger.info(f"PDF generado y subido exitosamente para entrada {entrada.id} (QR: {entrada.codigo_qr})")
                    return (True, entrada.id)
                except Exception as e:
                    logger.error(f"Error generando PDF para entrada {entrada.id}: {e}", exc_info=True)
                    return (False, entrada.id)
            
            with ProcessPoolExecutor(max_workers=max_workers) as executor:
                tasks = [process_entrada_pdf(entrada, executor) for entrada in entradas]
                results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    pdfs_fallidos += 1
                    logger.error(f"Excepción inesperada en generación de PDF: {result}", exc_info=True)
                else:
                    success, entrada_id = result
                    if success:
                        pdfs_generados += 1
                    else:
                        pdfs_fallidos += 1
            
            logger.info(f"Generación de PDFs completada: {pdfs_generados} exitosos, {pdfs_fallidos} fallidos de {len(entradas)} entradas")
        except Exception as e:
            logger.error(f"Error crítico generando PDFs para entradas {entrada_ids}: {e}", exc_info=True)
    
    async def get_entrada_qr_pdf_url(self, entrada_id: int, cliente_id: int) -> Dict:
        from app.models import Evento, Local
        from app.services.shared import S3Service
        
        stmt = (
            select(Entrada)
            .options(
                selectinload(Entrada.zona).selectinload(Zona.evento).selectinload(Evento.local),
                selectinload(Entrada.cliente).selectinload(Cliente.usuario)
            )
            .where(Entrada.id == entrada_id, Entrada.cliente_id == cliente_id)
        )
        result = await self.db.execute(stmt)
        entrada = result.scalar_one_or_none()
        
        if not entrada:
            raise BusinessError("Entrada no encontrada o no pertenece al cliente", 404)
        
        s3_service = S3Service()
        s3_key = f"entradas/entrada_{entrada_id}.pdf"
        
        # Verificar si el PDF existe antes de generar la URL presignada
        pdf_exists = await s3_service.pdf_exists(entrada_id)
        if not pdf_exists:
            logger.warning(f"PDF no encontrado en S3 para entrada {entrada_id}")
            raise BusinessError("PDF no disponible. El PDF se está generando en segundo plano.", 404)
        
        try:
            presigned_url = await s3_service.get_presigned_url_download(s3_key, expiration=3600)
            return ResponseHandler.success_response(
                {"pdf_url": presigned_url, "entrada_id": entrada_id},
                "URL de descarga generada exitosamente"
            )
        except Exception as e:
            logger.error(f"Error generando URL presignada para entrada {entrada_id}: {e}")
            raise BusinessError("Error generando URL de descarga del PDF.", 500)

