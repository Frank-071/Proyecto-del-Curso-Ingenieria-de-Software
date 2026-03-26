"""
Script para crear las tablas de Pagos y DetallesPagos si no existen
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para poder importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import engine
from app.models import Pago, DetallePago
from app.database.base import Base

async def create_tables():
    """Crear las tablas de pagos si no existen"""
    try:
        async with engine.begin() as conn:
            # Crear solo las tablas de pagos
            await conn.run_sync(lambda sync_conn: Base.metadata.create_all(
                sync_conn, 
                tables=[Pago.__table__, DetallePago.__table__],
                checkfirst=True
            ))
        print("✅ Tablas de pagos creadas/verificadas exitosamente")
    except Exception as e:
        print(f"❌ Error al crear tablas: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())