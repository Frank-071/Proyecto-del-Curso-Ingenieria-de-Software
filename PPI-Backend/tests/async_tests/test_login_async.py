'''
Antes de realizar el test, comentar linea 23 al 27 para que no interfiera el rate limiting
'''

import asyncio
import httpx
import time
from typing import List, Dict
import sys

# Configuración
BASE_URL = "http://localhost:8000"

TEST_EMAIL = "joseph_539_1@hotmail.com"
TEST_PASSWORD = "123"

# Configuración eliminada: colores no funcionan en esta consola


async def single_login(client: httpx.AsyncClient, user_num: int) -> Dict:
    """
    Realiza un intento de login y mide el tiempo.
    
    Returns:
        dict con información del resultado (duración, éxito, etc.)
    """
    start = time.time()
    try:
        response = await client.post(
            f"{BASE_URL}/usuarios/login",
            json={
                "email": TEST_EMAIL,
                "contrasena": TEST_PASSWORD
            },
            timeout=30.0
        )
        duration = time.time() - start
        
        return {
            "user_num": user_num,
            "status": response.status_code,
            "duration": duration,
            "success": response.status_code == 200,
            "error": None if response.status_code == 200 else response.text
        }
    except Exception as e:
        duration = time.time() - start
        return {
            "user_num": user_num,
            "status": "error",
            "duration": duration,
            "success": False,
            "error": str(e)
        }


def print_header(text: str, char: str = "="):
    """Imprime un header bonito"""
    print(f"\n{char*70}")
    print(f" {text}")
    print(f"{char*70}\n")


def print_metric(label: str, value: str, color: str = ""):
    """Imprime una métrica con formato"""
    print(f"   {label:<30}{value}")


async def test_concurrent_logins(num_users: int = 10) -> Dict:
    """
    Ejecuta múltiples logins concurrentemente y analiza los resultados.
    
    Args:
        num_users: Número de logins simultáneos a ejecutar
        
    Returns:
        dict con resultados del test
    """
    print_header(f"TEST: {num_users} LOGINS SIMULTANEOS")
    
    limits = httpx.Limits(max_connections=100, max_keepalive_connections=50)
    async with httpx.AsyncClient(limits=limits) as client:
        # Warm up - El primer login puede ser más lento (conexión inicial, cache, etc.)
        print("Warm up (primer login para inicializar conexion)...")
        warmup = await single_login(client, 0)
        print(f"   Warm up completado en {warmup['duration']:.3f}s\n")
        
        # Test real con múltiples usuarios
        print(f"Ejecutando {num_users} logins en PARALELO...\n")
        start_time = time.time()
        
        # Crear y ejecutar todas las tareas en paralelo
        tasks = [single_login(client, i+1) for i in range(num_users)]
        results = await asyncio.gather(*tasks)
        
        total_time = time.time() - start_time
        
        # Calcular estadísticas
        successful = sum(1 for r in results if r["success"])
        failed = num_users - successful
        durations = [r["duration"] for r in results]
        avg_duration = sum(durations) / len(durations)
        max_duration = max(durations)
        min_duration = min(durations)
        
        return {
            "num_users": num_users,
            "total_time": total_time,
            "successful": successful,
            "failed": failed,
            "avg_duration": avg_duration,
            "max_duration": max_duration,
            "min_duration": min_duration,
            "results": results
        }


def analyze_async_performance(stats: Dict):
    """
    Analiza si el rendimiento indica comportamiento async o bloqueante.
    
    En modo BLOQUEANTE:
        - Tiempo total ≈ num_users * tiempo_bcrypt
        - Ejemplo: 10 users * 0.3s = 3 segundos
        
    En modo ASYNC:
        - Tiempo total ≈ tiempo_bcrypt (todos en paralelo)
        - Ejemplo: 10 users en ~0.5s total
    """
    print_header("RESULTADOS DEL TEST")
    
    # Métricas básicas
    print_metric("Usuarios simultáneos:", str(stats["num_users"]))
    print_metric("Tiempo TOTAL:", f"{stats['total_time']:.3f}s")
    print_metric("Promedio por login:", f"{stats['avg_duration']:.3f}s")
    print_metric("Login más rápido:", f"{stats['min_duration']:.3f}s")
    print_metric("Login más lento:", f"{stats['max_duration']:.3f}s")
    print_metric("Exitosos:", f"{stats['successful']}/{stats['num_users']}")
    
    if stats['failed'] > 0:
        print_metric("Fallidos:", f"{stats['failed']}")
    
    # Análisis de comportamiento async
    print_header("ANALISIS DE COMPORTAMIENTO ASYNC")
    
    # Bcrypt toma aproximadamente 250-350ms por operación
    expected_sequential = stats["num_users"] * 0.3  # Tiempo si fuera bloqueante
    improvement = expected_sequential / stats["total_time"]
    
    print(f"   Escenario BLOQUEANTE (sin async):")
    print(f"      {stats['num_users']} logins × 0.3s cada uno = {expected_sequential:.1f}s\n")
    
    print(f"   Escenario ASYNC (con asyncio.to_thread):")
    print(f"      {stats['num_users']} logins en paralelo = {stats['total_time']:.2f}s\n")
    
    # Verificación del comportamiento
    # Si el tiempo total es menos del 50% del tiempo secuencial, es claramente async
    threshold = expected_sequential * 0.5
    
    if stats["total_time"] < threshold:
        print(f"   [OK] ASYNC FUNCIONANDO CORRECTAMENTE")
        print(f"   [OK] Tiempo total ({stats['total_time']:.2f}s) << Tiempo secuencial ({expected_sequential:.1f}s)")
        print(f"   [OK] Los logins se procesaron en PARALELO")
        print(f"   [>>] Mejora de rendimiento: {improvement:.1f}x mas rapido")
        print(f"\n   Explicacion:")
        print(f"      Bcrypt se ejecuta en threads separados gracias a asyncio.to_thread(),")
        print(f"      permitiendo que el event loop procese otras requests mientras tanto.")
        return True
    elif stats["total_time"] < expected_sequential * 0.8:
        print(f"   [WARN] ASYNC PARCIALMENTE FUNCIONANDO")
        print(f"   [WARN] Hay mejora ({improvement:.1f}x) pero no la esperada")
        print(f"   [WARN] Puede haber contencion de recursos o limitacion de threads")
        return True
    else:
        print(f"   [ERROR] POSIBLE PROBLEMA: COMPORTAMIENTO BLOQUEANTE")
        print(f"   [ERROR] Tiempo total ({stats['total_time']:.2f}s) similar a secuencial ({expected_sequential:.1f}s)")
        print(f"   [ERROR] Los logins parecen estar bloqueandose mutuamente")
        print(f"\n   Posibles causas:")
        print(f"      1. asyncio.to_thread() no está siendo usado")
        print(f"      2. hash_password/verify_password son funciones síncronas")
        print(f"      3. Thread pool saturado")
        return False


def print_detailed_results(results: List[Dict], show_all: bool = False):
    """Imprime detalle de cada request"""
    print_header("DETALLE POR REQUEST")
    
    # Ordenar por duración
    sorted_results = sorted(results, key=lambda x: x['duration'])
    
    # Mostrar primeros 5, últimos 5, o todos
    to_show = results if show_all or len(results) <= 10 else (sorted_results[:5] + sorted_results[-5:])
    
    for r in to_show:
        status_icon = "[OK]" if r["success"] else "[FAIL]"
        
        status_text = f"HTTP {r['status']}" if isinstance(r['status'], int) else "ERROR"
        print(f"   {status_icon} User {r['user_num']:2d}: {r['duration']:.3f}s - {status_text}")
        
        if not r["success"] and r.get("error"):
            print(f"      Error: {r['error'][:100]}")
    
    if not show_all and len(results) > 10:
        print(f"\n   ... ({len(results)-10} resultados intermedios omitidos)")


async def check_server_connection():
    """Verifica que el servidor esté corriendo"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BASE_URL}/health/liveness")
            return response.status_code == 200
    except:
        return False


async def main():
    """Función principal del test"""
    print("\n" + "="*70)
    print("  TEST DE COMPORTAMIENTO ASYNC - LOGIN")
    print("="*70)
    
    # Verificar que el servidor esté corriendo
    print("\nVerificando conexion al servidor...")
    if not await check_server_connection():
        print(f"[ERROR] No se puede conectar al servidor en {BASE_URL}")
        print("   Por favor, inicia el servidor con:")
        print("   uvicorn app.main:app --reload")
        return
    print("[OK] Servidor conectado correctamente")
    
    # Test 1: Carga ligera (5 usuarios)
    print("\nTEST 1: Carga ligera (5 usuarios)")
    stats_light = await test_concurrent_logins(5)
    is_async_light = analyze_async_performance(stats_light)
    print_detailed_results(stats_light["results"])
    
    await asyncio.sleep(1)  # Pausa entre tests
    
    # Test 2: Carga media (10 usuarios)
    print("\nTEST 2: Carga media (10 usuarios)")
    stats_medium = await test_concurrent_logins(10)
    is_async_medium = analyze_async_performance(stats_medium)
    print_detailed_results(stats_medium["results"])
    
    await asyncio.sleep(1)
    
    # Test 3: Carga alta (20 usuarios)
    print("\nTEST 3: Carga alta (20 usuarios)")
    stats_high = await test_concurrent_logins(20)
    is_async_high = analyze_async_performance(stats_high)
    print_detailed_results(stats_high["results"], show_all=False)
    
    # Resumen final
    print_header("RESUMEN FINAL")
    
    all_passed = is_async_light and is_async_medium and is_async_high
    
    if all_passed:
        print("   [OK] TODOS LOS TESTS PASARON")
        print("   [OK] El sistema maneja requests de login de manera async")
        print("   [OK] Bcrypt NO bloquea el event loop")
        print("   [OK] El servidor puede manejar multiples logins simultaneos")
        print("\n   [>>] Tu backend esta listo para manejar alta concurrencia")
    else:
        print("   [ERROR] ALGUNOS TESTS FALLARON")
        print("   [ERROR] Hay indicios de comportamiento bloqueante")
        print("\n   Recomendaciones:")
        print(f"      1. Verificar que hash_password y verify_password usen asyncio.to_thread()")
        print(f"      2. Revisar que todas las funciones en la cadena sean async")
        print(f"      3. Verificar logs del servidor por errores")
    
    print("\n" + "="*70)
    print("  TEST COMPLETADO")
    print("="*70 + "\n")


if __name__ == "__main__":
    print("\nINSTRUCCIONES:")
    print("1. Asegurate de que el servidor este corriendo: uvicorn app.main:app --reload")
    print("2. Edita las credenciales TEST_EMAIL y TEST_PASSWORD en este archivo")
    print("3. Asegurate de tener un usuario con esas credenciales en la BD")
    print("\nPresiona Ctrl+C para cancelar...\n")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n[WARN] Test cancelado por el usuario\n")
        sys.exit(0)

