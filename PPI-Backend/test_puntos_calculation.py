#!/usr/bin/env python3
"""
Test simple para verificar cálculo de puntos
"""

from decimal import Decimal

def _calculate_points(precio: Decimal, descuento_por_entrada: Decimal = Decimal('0.0')) -> int:
    """
    Calcula puntos basado en el precio con descuento aplicado: 1 punto por cada 5 soles
    """
    precio_efectivo = max(precio - descuento_por_entrada, Decimal('0.0'))
    puntos_calculados = int(precio_efectivo // 5)
    print(f"🔢 CALCULO PUNTOS: precio={precio}, descuento={descuento_por_entrada}, precio_efectivo={precio_efectivo}, division={precio_efectivo / 5}, floor_division={precio_efectivo // 5}, puntos={puntos_calculados}")
    return puntos_calculados

if __name__ == "__main__":
    print("=== TEST REDONDEO HACIA ABAJO ===")
    
    # Casos de prueba
    test_cases = [
        (Decimal('27.50'), Decimal('0.0')),  # 27.50 / 5 = 5.5 -> debe ser 5
        (Decimal('15.10'), Decimal('0.0')),  # 15.10 / 5 = 3.02 -> debe ser 3
        (Decimal('24.99'), Decimal('0.0')),  # 24.99 / 5 = 4.998 -> debe ser 4
        (Decimal('25.00'), Decimal('0.0')),  # 25.00 / 5 = 5.0 -> debe ser 5
        (Decimal('30.00'), Decimal('5.0')),  # (30-5) / 5 = 5.0 -> debe ser 5
        (Decimal('27.50'), Decimal('2.5')),  # (27.5-2.5) / 5 = 5.0 -> debe ser 5
    ]
    
    for precio, descuento in test_cases:
        resultado = _calculate_points(precio, descuento)
        print()