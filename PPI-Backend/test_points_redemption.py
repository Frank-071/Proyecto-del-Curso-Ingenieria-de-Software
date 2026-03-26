#!/usr/bin/env python3
"""
Test para verificar el registro de decremento de puntos en checkout
"""

import asyncio
import logging
from app.database.connection import get_db
from app.services.eventos.entrada_service import EntradaService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_points_redemption():
    """Prueba la funcionalidad de decremento de puntos en checkout"""
    
    # Obtener conexión a la base de datos
    async for db in get_db():
        try:
            service = EntradaService(db)
            
            # Datos de prueba
            cliente_id = 1  # Asume que existe un cliente con ID 1
            zona_id = 1     # Asume que existe una zona con ID 1
            cantidad = 2    # Comprar 2 entradas
            puntos_canjeados = 50  # Canjear 50 puntos
            descuento_total = 10.0  # 50 puntos = 10 soles de descuento (1 punto = 0.2 soles)
            
            logger.info(f"🧪 Probando checkout con canjeo de puntos")
            logger.info(f"   Cliente ID: {cliente_id}")
            logger.info(f"   Zona ID: {zona_id}")
            logger.info(f"   Cantidad entradas: {cantidad}")
            logger.info(f"   Puntos canjeados: {puntos_canjeados}")
            logger.info(f"   Descuento aplicado: S/{descuento_total}")
            
            # Realizar el checkout con canjeo de puntos
            result = await service.create_entradas_bulk(
                zona_id=zona_id,
                cliente_id=cliente_id,
                cantidad=cantidad,
                descuento_total=descuento_total,
                total_entradas_checkout=cantidad,
                puntos_canjeados=puntos_canjeados
            )
            
            if result.get("status") == "success":
                logger.info("✅ Checkout exitoso con canjeo de puntos")
                logger.info(f"   Entradas creadas: {result['data']['cantidad']}")
                
                # Verificar que se creó el registro de decremento
                logger.info("📝 Verifica en la base de datos:")
                logger.info(f"   - Tabla RegistrosPuntos: debe haber 1 registro de tipo 'Decremento' con {puntos_canjeados} puntos")
                logger.info(f"   - Tabla Clientes: los puntos_disponibles del cliente {cliente_id} deben haberse reducido en {puntos_canjeados}")
                logger.info(f"   - También debe haber {cantidad} registros de tipo 'Aumento' por las entradas creadas")
                
            else:
                logger.error(f"❌ Error en checkout: {result}")
                
        except Exception as e:
            logger.error(f"❌ Error en prueba: {e}")
            
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(test_points_redemption())