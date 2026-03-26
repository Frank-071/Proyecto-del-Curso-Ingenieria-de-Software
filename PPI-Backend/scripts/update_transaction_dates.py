"""Script optimizado para actualizar fechas con distribución 20% Sep, 30% Oct, 50% Nov."""
import asyncio
import os
import random
import sys
from datetime import datetime, timedelta
from typing import List, Tuple

from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from app.database.connection import AsyncSessionLocal, engine  # type: ignore  # noqa: E402
from app.models import Pago, Entrada, RegistroPunto  # type: ignore  # noqa: E402


# Configuración de fechas - Distribución: 20% Sep, 30% Oct, 50% Nov
FECHA_SEPTIEMBRE_INICIO = datetime(2024, 9, 1, 0, 0, 0)
FECHA_SEPTIEMBRE_FIN = datetime(2024, 9, 30, 23, 59, 59)
FECHA_OCTUBRE_INICIO = datetime(2024, 10, 1, 0, 0, 0)
FECHA_OCTUBRE_FIN = datetime(2024, 10, 31, 23, 59, 59)
FECHA_NOVIEMBRE_INICIO = datetime(2024, 11, 1, 0, 0, 0)
FECHA_NOVIEMBRE_FIN = datetime(2024, 11, 30, 23, 59, 59)

ENTRADA_ID_INICIO = 113
ENTRADA_ID_FIN = 7522
RANDOM_SEED = 20241125


def generar_fecha_aleatoria() -> datetime:
    """
    Genera una fecha aleatoria con distribución ponderada:
    - Septiembre: 20%
    - Octubre: 30%
    - Noviembre: 50%
    """
    # Generar número aleatorio entre 0 y 100
    rand = random.randint(0, 99)
    
    # Distribuir según porcentajes
    if rand < 20:  # 0-19: Septiembre (20%)
        fecha_inicio = FECHA_SEPTIEMBRE_INICIO
        fecha_fin = FECHA_SEPTIEMBRE_FIN
    elif rand < 50:  # 20-49: Octubre (30%)
        fecha_inicio = FECHA_OCTUBRE_INICIO
        fecha_fin = FECHA_OCTUBRE_FIN
    else:  # 50-99: Noviembre (50%)
        fecha_inicio = FECHA_NOVIEMBRE_INICIO
        fecha_fin = FECHA_NOVIEMBRE_FIN
    
    # Generar fecha aleatoria dentro del mes seleccionado
    delta = fecha_fin - fecha_inicio
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return fecha_inicio + timedelta(seconds=random_seconds)


async def obtener_pagos_a_actualizar(session) -> List[Tuple[int, List[int]]]:
    """
    Obtiene los pagos relacionados con las entradas de prueba (OPTIMIZADO).
    Retorna: Lista de tuplas (pago_id, [entrada_ids])
    """
    from collections import defaultdict
    from app.models.pagos.detalle_pago import DetallePago
    
    print("🔍 Obteniendo pagos a actualizar...")
    
    # OPTIMIZACIÓN: Una sola query con JOIN para obtener todo de una vez
    stmt = select(
        Entrada.id,
        DetallePago.pago_id
    ).join(
        DetallePago,
        Entrada.pago_detalle_id == DetallePago.id
    ).where(
        Entrada.id >= ENTRADA_ID_INICIO,
        Entrada.id <= ENTRADA_ID_FIN,
        Entrada.pago_detalle_id.isnot(None)
    )
    
    result = await session.execute(stmt)
    entradas_con_pago = result.all()
    
    print(f"📊 Total de entradas a procesar: {len(entradas_con_pago)}")
    
    # Agrupar entradas por pago_id
    pagos_entradas = defaultdict(list)
    for entrada_id, pago_id in entradas_con_pago:
        pagos_entradas[pago_id].append(entrada_id)
    
    print(f"💳 Total de pagos únicos a actualizar: {len(pagos_entradas)}")
    
    return list(pagos_entradas.items())


async def actualizar_fechas_por_pago(session, pago_id: int, entrada_ids: List[int], nueva_fecha: datetime) -> None:
    """
    Actualiza las fechas de un pago y todas sus entradas y registros de puntos relacionados.
    """
    try:
        # 1. Actualizar Pago
        await session.execute(
            update(Pago)
            .where(Pago.id == pago_id)
            .values(fecha_transaccion=nueva_fecha)
        )
        
        # 2. Actualizar Entradas
        await session.execute(
            update(Entrada)
            .where(Entrada.id.in_(entrada_ids))
            .values(fecha_creacion=nueva_fecha)
        )
        
        # 3. Actualizar RegistrosPuntos relacionados con estas entradas
        await session.execute(
            update(RegistroPunto)
            .where(RegistroPunto.entrada_id.in_(entrada_ids))
            .values(fecha_registro=nueva_fecha)
        )
        
        await session.commit()
        
    except SQLAlchemyError as e:
        await session.rollback()
        raise e


async def actualizar_fechas_batch(pagos_entradas: List[Tuple[int, List[int]]], batch_size: int = 50) -> None:
    """
    Actualiza las fechas en batches para mejor rendimiento.
    """
    total_pagos = len(pagos_entradas)
    
    for i in range(0, total_pagos, batch_size):
        batch = pagos_entradas[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_pagos + batch_size - 1) // batch_size
        
        print(f"\n📦 Procesando batch {batch_num}/{total_batches} ({len(batch)} pagos)...")
        
        async with AsyncSessionLocal() as session:
            for pago_id, entrada_ids in batch:
                nueva_fecha = generar_fecha_aleatoria()
                
                try:
                    await actualizar_fechas_por_pago(session, pago_id, entrada_ids, nueva_fecha)
                    mes_nombre = nueva_fecha.strftime('%B')
                    print(f"  ✓ Pago {pago_id}: {len(entrada_ids)} entradas → {nueva_fecha.strftime('%Y-%m-%d %H:%M:%S')} ({mes_nombre})")
                    
                except Exception as e:
                    print(f"  ✗ Error en Pago {pago_id}: {e}")
        
        print(f"✅ Batch {batch_num}/{total_batches} completado")


async def main():
    """Función principal"""
    random.seed(RANDOM_SEED)
    
    print("=" * 80)
    print("🔄 ACTUALIZACIÓN DE FECHAS - Distribución 20% Sep, 30% Oct, 50% Nov")
    print("=" * 80)
    print(f"\n📅 Distribución: 20% Septiembre, 30% Octubre, 50% Noviembre")
    print(f"🎫 Rango de entradas: {ENTRADA_ID_INICIO} a {ENTRADA_ID_FIN}")
    print(f"🌱 Semilla aleatoria: {RANDOM_SEED}\n")
    
    # Obtener pagos a actualizar (OPTIMIZADO)
    async with AsyncSessionLocal() as session:
        pagos_entradas = await obtener_pagos_a_actualizar(session)
    
    if not pagos_entradas:
        print("⚠️  No se encontraron pagos para actualizar")
        return
    
    # Confirmar antes de proceder
    total_entradas = sum(len(entradas) for _, entradas in pagos_entradas)
    total_pagos = len(pagos_entradas)
    
    print(f"\n📊 Resumen:")
    print(f"   - Pagos a actualizar: {total_pagos}")
    print(f"   - Entradas a actualizar: {total_entradas}")
    print(f"   - RegistrosPuntos a actualizar: {total_entradas} (aprox.)")
    print(f"\n📈 Distribución esperada:")
    print(f"   - Septiembre: ~{int(total_pagos * 0.20)} pagos (20%)")
    print(f"   - Octubre: ~{int(total_pagos * 0.30)} pagos (30%)")
    print(f"   - Noviembre: ~{int(total_pagos * 0.50)} pagos (50%)")
    
    input("\n⚠️  Presiona ENTER para continuar o Ctrl+C para cancelar...")
    
    # Actualizar en batches
    await actualizar_fechas_batch(pagos_entradas, batch_size=50)
    
    await engine.dispose()
    
    print("\n" + "=" * 80)
    print("✅ ACTUALIZACIÓN COMPLETADA")
    print("=" * 80)
    print(f"\n📊 Estadísticas finales:")
    print(f"   - Pagos actualizados: {total_pagos}")
    print(f"   - Entradas actualizadas: {total_entradas}")
    print(f"   - Distribución: 20% Sep, 30% Oct, 50% Nov")
    print("\n💡 Verifica la distribución con:")
    print("   SELECT DATE_FORMAT(fecha_transaccion, '%Y-%m') as mes, COUNT(*) as total,")
    print("          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Pagos), 2) as porcentaje")
    print("   FROM Pagos")
    print("   WHERE fecha_transaccion BETWEEN '2024-09-01' AND '2024-11-30'")
    print("   GROUP BY mes ORDER BY mes;")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n❌ Operación cancelada por el usuario")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
