#!/usr/bin/env python3
"""
Script para probar y diagnosticar problemas con el registro de zonas
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.eventos.evento import Evento
from app.models.eventos.zona import Zona
from app.repositories.eventos.evento_repository import EventoRepository
from app.repositories.eventos.zona_repository import ZonaRepository


def test_zonas_registration():
    """Prueba el registro y consulta de zonas"""
    
    # Obtener sesión de base de datos
    db = next(get_db())
    
    try:
        evento_repo = EventoRepository(db)
        zona_repo = ZonaRepository(db)
        
        print("=== DIAGNÓSTICO DE ZONAS ===")
        print()
        
        # Verificar eventos existentes
        eventos = evento_repo.get_all()
        print(f"Total de eventos encontrados: {len(eventos)}")
        print()
        
        for evento in eventos:
            print(f"Evento ID: {evento.id}")
            print(f"Nombre: {evento.nombre}")
            print(f"Estado: {evento.estado}")
            print(f"Activo: {evento.activo}")
            
            # Obtener zonas para este evento
            zonas = zona_repo.get_by_evento(evento.id)
            print(f"Zonas encontradas: {len(zonas)}")
            
            if zonas:
                for zona in zonas:
                    print(f"  - Zona ID: {zona.id}")
                    print(f"    Nombre: {zona.nombre}")
                    print(f"    Precio: {zona.precio}")
                    print(f"    Stock: {zona.stock_entradas}")
                    print(f"    Disponibles: {zona.entradas_disponible}")
                    print(f"    Evento ID: {zona.evento_id}")
            else:
                print("  ⚠️  No se encontraron zonas para este evento")
            
            print("-" * 50)
            print()
        
        # Verificar todas las zonas en la base de datos
        print("=== TODAS LAS ZONAS EN LA BASE DE DATOS ===")
        all_zonas = db.query(Zona).all()
        print(f"Total de zonas en la base de datos: {len(all_zonas)}")
        
        for zona in all_zonas:
            print(f"Zona ID: {zona.id}, Evento ID: {zona.evento_id}, Nombre: {zona.nombre}")
        
    except Exception as e:
        print(f"Error durante la prueba: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    test_zonas_registration()