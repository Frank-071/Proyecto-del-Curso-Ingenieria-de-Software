"""Simulación masiva de compras de entradas para clientes poblando Entradas, Pagos y Puntos."""
import asyncio
import os
import random
import sys
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Sequence

from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from app.core.exceptions import BusinessError  # type: ignore  # noqa: E402
from app.database.connection import AsyncSessionLocal, engine  # type: ignore  # noqa: E402
from app.schemas.eventos.entrada import (  # type: ignore  # noqa: E402
    EntradaBulkMultiItem,
    EntradaBulkMultiRequest,
)
from app.services.pagos import PagoService  # type: ignore  # noqa: E402
from app.schemas.pagos import PagoCompletoRequest, DetallePagoRequest  # type: ignore  # noqa: E402
from app.models import Zona, Entrada, Cliente, RegistroPunto  # type: ignore  # noqa: E402


class MinimalEntradaService:
    def __init__(self, db):
        self.db = db

    def _calculate_points(self, precio: Decimal, descuento_por_entrada: Decimal = Decimal('0.0')) -> int:
        precio_efectivo = max(precio - descuento_por_entrada, Decimal('0.0'))
        return int(precio_efectivo // 5)

    async def _bulk_create_punto_registros(self, entradas_con_puntos: list, cliente_id: int, pago_id: int = None) -> int:
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
        return total_puntos

    async def _bulk_update_cliente_puntos(self, cliente_id: int, puntos_ganados: int, puntos_canjeados: int = 0):
        puntos_netos = puntos_ganados - puntos_canjeados
        await self.db.execute(
            update(Cliente)
            .where(Cliente.id == cliente_id)
            .values(
                puntos_disponibles=Cliente.puntos_disponibles + puntos_netos,
                puntos_historicos=Cliente.puntos_historicos + puntos_ganados
            )
        )

    async def create_entradas_bulk_multi(self, payload, cliente_id: int) -> Dict:
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

            # Validar zonas y mapa zona_id -> Zona
            zona_map = {}
            event_ids = set()
            for it in items:
                zona_id = int(getattr(it, 'zona_id'))
                cantidad = int(getattr(it, 'cantidad'))
                if cantidad <= 0:
                    raise BusinessError(f'Cantidad inválida para zona {zona_id}', 400)

                stmt = select(Zona).where(Zona.id == zona_id)
                result = await self.db.execute(stmt)
                zona = result.scalar_one_or_none()
                if not zona:
                    raise BusinessError(f'Zona {zona_id} no encontrada', 404)
                zona_map[zona_id] = zona
                if getattr(zona, 'evento_id', None):
                    event_ids.add(zona.evento_id)

            # Transacción
            entradas_creadas = []
            entradas_con_puntos = []

            # Actualizar stock por zona
            for it in items:
                zona_id = int(getattr(it, 'zona_id'))
                cantidad = int(getattr(it, 'cantidad'))
                result = await self.db.execute(
                    update(Zona)
                    .where(Zona.id == zona_id, Zona.entradas_disponible >= cantidad)
                    .values(entradas_disponible=Zona.entradas_disponible - cantidad)
                )
                if result.rowcount == 0:
                    raise BusinessError(f'No hay suficientes entradas disponibles para la zona {zona_id}', 400)

            # Crear entradas
            for it in items:
                zona_id = int(getattr(it, 'zona_id'))
                cantidad = int(getattr(it, 'cantidad'))
                zona = zona_map[zona_id]
                for _ in range(cantidad):
                    puntos_calculados = self._calculate_points(zona.precio, descuento_por_entrada)
                    db_entrada = Entrada(
                        cliente_id=cliente_id,
                        zona_id=zona_id,
                        fue_transferida=False,
                        escaneada=False,
                        estado_nominacion='Pendiente',
                        puntos_generados=puntos_calculados
                    )
                    self.db.add(db_entrada)
                    entradas_creadas.append(db_entrada)

            await self.db.flush()

            for entrada in entradas_creadas:
                entradas_con_puntos.append((entrada.id, entrada.puntos_generados))

            # Pago si aplica
            pago_id = None
            total_pago = Decimal('0')
            metodo_pago_id = getattr(payload, 'metodo_pago_id', None)
            if metodo_pago_id:
                detalles_pago = []
                for it in items:
                    zona_id = int(getattr(it, 'zona_id'))
                    cantidad = int(getattr(it, 'cantidad'))
                    zona = zona_map[zona_id]
                    detalles_pago.append(
                        DetallePagoRequest(
                            zona_id=zona_id,
                            cantidad=cantidad,
                            subtotal=zona.precio * cantidad,
                            promocion_id=None
                        )
                    )

                total_puntos = sum(entrada.puntos_generados for entrada in entradas_creadas)
                pago_request = PagoCompletoRequest(
                    metodo_pago_id=metodo_pago_id,
                    detalles=detalles_pago
                )

                pago_service = PagoService(self.db)
                resultado_pago = await pago_service.crear_pago_completo(
                    cliente_id=cliente_id,
                    request=pago_request,
                    descuento_puntos=descuento_total,
                    descuento_rango=Decimal('0'),
                    total_puntos_otorgados=total_puntos
                )

                pago_id = resultado_pago['pago_id']
                total_pago = resultado_pago['total']
                detalles_ids = resultado_pago['detalles_ids']

                # Asociar pago_detalle_id a entradas
                for entrada in entradas_creadas:
                    zona_id_entrada = entrada.zona_id
                    for j, detalle in enumerate(detalles_pago):
                        if detalle.zona_id == zona_id_entrada:
                            entrada.pago_detalle_id = detalles_ids[j]
                            break
                await self.db.flush()
            else:
                total_puntos = sum(entrada.puntos_generados for entrada in entradas_creadas)

            # Registrar puntos
            await self._bulk_create_punto_registros(entradas_con_puntos, cliente_id, pago_id)
            await self._bulk_update_cliente_puntos(cliente_id, total_puntos, puntos_canjeados)

            await self.db.commit()

            return {
                'entries': [],
                'points_remaining': None,
                'pago_id': pago_id,
                'total_pagado': float(total_pago) if total_pago else None
            }

        except SQLAlchemyError as e:
            await self.db.rollback()
            raise BusinessError("Error interno al crear entradas", 500)


# Configuraciones de simulación
CLIENT_ID_START = 102
CLIENT_ID_END = 1004
METODO_PAGO_ID = 1
MAX_TICKETS_PER_EVENT = 4
MIN_EVENTS_PER_CLIENT = 5
RANDOM_SEED = 20251124
BATCH_SIZE = 100  # Procesar 100 clientes en paralelo

# Zonas válidas (evento_id != 6)
ZONAS_CONFIG = [
    {"zona_id": 1, "evento_id": 1},
    {"zona_id": 3, "evento_id": 2},
    {"zona_id": 5, "evento_id": 3},
    {"zona_id": 6, "evento_id": 3},
    {"zona_id": 9, "evento_id": 4},
    {"zona_id": 10, "evento_id": 4},
    {"zona_id": 11, "evento_id": 5},
    {"zona_id": 12, "evento_id": 5},
    {"zona_id": 13, "evento_id": 5},
    {"zona_id": 16, "evento_id": 5},
    {"zona_id": 28, "evento_id": 8},
    {"zona_id": 29, "evento_id": 8},
    {"zona_id": 31, "evento_id": 13},
    {"zona_id": 32, "evento_id": 14},
    {"zona_id": 33, "evento_id": 14},
    {"zona_id": 34, "evento_id": 14},
    {"zona_id": 35, "evento_id": 15},
    {"zona_id": 36, "evento_id": 15},
    {"zona_id": 37, "evento_id": 15},
    {"zona_id": 38, "evento_id": 15},
    {"zona_id": 39, "evento_id": 16},
    {"zona_id": 40, "evento_id": 16},
    {"zona_id": 41, "evento_id": 17},
    {"zona_id": 42, "evento_id": 17},
    {"zona_id": 43, "evento_id": 17},
    {"zona_id": 44, "evento_id": 17},
    {"zona_id": 45, "evento_id": 17},
    {"zona_id": 46, "evento_id": 18},
    {"zona_id": 47, "evento_id": 18},
    {"zona_id": 48, "evento_id": 18},
    {"zona_id": 49, "evento_id": 18},
    {"zona_id": 50, "evento_id": 18},
    {"zona_id": 51, "evento_id": 18},
    {"zona_id": 52, "evento_id": 18},
    {"zona_id": 53, "evento_id": 18},
    {"zona_id": 54, "evento_id": 18},
]


def build_event_zone_map(zonas: Sequence[Dict[str, int]]) -> Dict[int, List[int]]:
    event_map: Dict[int, List[int]] = defaultdict(list)
    for zona in zonas:
        event_map[zona["evento_id"]].append(zona["zona_id"])
    return dict(event_map)


async def validar_zonas_existentes(session) -> None:
    zona_ids = [zona["zona_id"] for zona in ZONAS_CONFIG]
    stmt = select(Zona.id).where(Zona.id.in_(zona_ids))
    result = await session.execute(stmt)
    encontrados = {row[0] for row in result.all()}
    faltantes = set(zona_ids) - encontrados
    if faltantes:
        raise BusinessError(f"Las zonas no existen en BD: {sorted(faltantes)}")


def generar_carrito_para_evento(zonas_disponibles: List[int], entradas_restantes: int) -> List[EntradaBulkMultiItem]:
    items: List[EntradaBulkMultiItem] = []
    zonas = zonas_disponibles.copy()
    random.shuffle(zonas)
    for zona_id in zonas:
        if entradas_restantes <= 0:
            break
        cantidad = random.randint(1, min(entradas_restantes, 4))
        items.append(EntradaBulkMultiItem(zona_id=zona_id, cantidad=cantidad))
        entradas_restantes -= cantidad
    return items


async def procesar_cliente(cliente_id: int, event_map: Dict[int, List[int]]) -> None:
    """Procesa un cliente con su propia sesión de base de datos"""
    async with AsyncSessionLocal() as session:
        try:
            entrada_service = MinimalEntradaService(session)
            eventos = list(event_map.keys())
            random.shuffle(eventos)
            
            # Seleccionar eventos para este cliente
            eventos_seleccionados = eventos[: max(MIN_EVENTS_PER_CLIENT, min(len(eventos), MIN_EVENTS_PER_CLIENT))]

            for evento_id in eventos_seleccionados:
                zonas_evento = event_map[evento_id]
                entradas_totales_evento = random.randint(1, MAX_TICKETS_PER_EVENT)
                items = generar_carrito_para_evento(zonas_evento, entradas_totales_evento)

                # Normalizar total a exactamente entradas_totales_evento
                total_actual = sum(item.cantidad for item in items)
                if total_actual != entradas_totales_evento and items:
                    diferencia = entradas_totales_evento - total_actual
                    items[-1].cantidad += diferencia

                payload = EntradaBulkMultiRequest(
                    total_entradas_checkout=entradas_totales_evento,
                    descuento_total=0,
                    puntos_canjeados=0,
                    metodo_pago_id=METODO_PAGO_ID,
                    descuento_rango=0,
                    items=items,
                )

                try:
                    await entrada_service.create_entradas_bulk_multi(payload, cliente_id)
                    print(f"✓ Cliente {cliente_id}: Evento {evento_id} -> {entradas_totales_evento} entradas")
                except BusinessError as exc:
                    await session.rollback()
                    print(f"✗ Cliente {cliente_id} - Evento {evento_id}: {exc}")
                except SQLAlchemyError as exc:
                    await session.rollback()
                    print(f"✗ Cliente {cliente_id} - Evento {evento_id}: Error DB")
                    
        except Exception as e:
            print(f"✗ Cliente {cliente_id}: Error general -> {e}")


async def procesar_batch(cliente_ids: List[int], event_map: Dict[int, List[int]]) -> None:
    """Procesa un batch de clientes en paralelo"""
    tasks = [procesar_cliente(cliente_id, event_map) for cliente_id in cliente_ids]
    await asyncio.gather(*tasks, return_exceptions=True)


async def simular_compras() -> None:
    """Simula compras de entradas para múltiples clientes en paralelo"""
    random.seed(RANDOM_SEED)
    event_map = build_event_zone_map(ZONAS_CONFIG)

    # Validar zonas una sola vez al inicio
    async with AsyncSessionLocal() as session:
        await validar_zonas_existentes(session)
        print(f"✓ Zonas validadas: {len(ZONAS_CONFIG)} zonas en {len(event_map)} eventos")

    # Dividir clientes en batches
    total_clientes = CLIENT_ID_END - CLIENT_ID_START + 1
    cliente_ids = list(range(CLIENT_ID_START, CLIENT_ID_END + 1))
    
    print(f"\n🚀 Iniciando simulación para {total_clientes} clientes en batches de {BATCH_SIZE}...")
    print(f"📊 Eventos disponibles: {sorted(event_map.keys())}")
    print(f"🎫 Min {MIN_EVENTS_PER_CLIENT} eventos por cliente, max {MAX_TICKETS_PER_EVENT} entradas por evento\n")

    # Procesar en batches
    for i in range(0, len(cliente_ids), BATCH_SIZE):
        batch = cliente_ids[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(cliente_ids) + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"\n📦 Procesando batch {batch_num}/{total_batches} (clientes {batch[0]}-{batch[-1]})...")
        await procesar_batch(batch, event_map)
        print(f"✅ Batch {batch_num}/{total_batches} completado")

    await engine.dispose()
    print(f"\n✅ Simulación completada: {total_clientes} clientes procesados")


if __name__ == "__main__":
    asyncio.run(simular_compras())
