#!/usr/bin/env python3
"""
Test para verificar el descuento de puntos en transferencias
"""

import asyncio
import sys
import os

# Agregar el directorio raíz al path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.connection import get_db_session

async def test_transfer_points():
    """Prueba la funcionalidad de descuento de puntos en transferencias"""
    
    async with get_db_session() as db:
        print("🔍 Verificando registros de puntos antes de transferencia...")
        
        # Buscar entradas con registros de puntos
        result = await db.execute(text("""
            SELECT 
                rp.id_entrada,
                rp.cantidad_puntos,
                rp.tipo_registro,
                c.nombre,
                c.puntos_disponibles
            FROM RegistrosPuntos rp
            JOIN Clientes c ON rp.id_cliente = c.cliente_id
            WHERE rp.tipo_registro = 'Aumento'
            LIMIT 5
        """))
        
        registros = result.fetchall()
        
        if not registros:
            print("❌ No se encontraron registros de puntos tipo 'Aumento'")
            return
            
        print("✅ Registros de puntos encontrados:")
        for reg in registros:
            print(f"  - Entrada {reg.id_entrada}: {reg.cantidad_puntos} puntos - Cliente: {reg.nombre} ({reg.puntos_disponibles} puntos disponibles)")
        
        # Verificar que existe la funcionalidad de descuento
        print("\n🧪 Verificando estructura de la tabla RegistrosPuntos...")
        
        result = await db.execute(text("""
            SELECT COUNT(*) as total_decrementos 
            FROM RegistrosPuntos 
            WHERE tipo_registro = 'Decremento'
        """))
        
        decrementos = result.scalar()
        print(f"📊 Registros de decremento actuales: {decrementos}")
        
        # Verificar que las entradas existen para transferencias
        print("\n🎫 Verificando entradas disponibles para transferencia...")
        
        result = await db.execute(text("""
            SELECT 
                e.entrada_id,
                e.cliente_id,
                c.nombre,
                ev.nombre as evento_nombre
            FROM Entradas e
            JOIN Clientes c ON e.cliente_id = c.cliente_id
            JOIN Eventos ev ON e.evento_id = ev.evento_id
            WHERE e.transferida = 0
            AND e.entrada_id IN (
                SELECT id_entrada 
                FROM RegistrosPuntos 
                WHERE tipo_registro = 'Aumento'
            )
            LIMIT 3
        """))
        
        entradas_transferibles = result.fetchall()
        
        if entradas_transferibles:
            print("✅ Entradas disponibles para transferencia con puntos:")
            for entrada in entradas_transferibles:
                print(f"  - Entrada {entrada.entrada_id}: Cliente {entrada.nombre} - Evento: {entrada.evento_nombre}")
        else:
            print("⚠️  No se encontraron entradas transferibles con registros de puntos")

if __name__ == "__main__":
    asyncio.run(test_transfer_points())