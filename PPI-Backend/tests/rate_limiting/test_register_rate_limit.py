import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:8000"


async def test_register_rate_limit_by_ip():
    print("Test 1: Rate Limit por IP en registro (5000 req/hora)")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    print("  Nota: Test abreviado (50 requests en vez de 5000)")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        success_count = 0
        
        for i in range(1, 51):
            register_data = {
                "email": f"testuser{i}@example.com",
                "contrasena": "Password123!",
                "numero_documento": f"{10000000 + i}"
            }
            try:
                response = await client.post(
                    f"{BASE_URL}/usuarios/register",
                    json=register_data,
                    timeout=5.0
                )
                
                if response.status_code in [201, 200]:
                    success_count += 1
                    if i % 10 == 0:
                        print(f"  [ALLOWED] Requests 1-{i}: All passing")
                elif response.status_code == 429:
                    print(f"  [BLOCKED] Request {i}: 429 - Limite alcanzado")
                    return False
                else:
                    if i == 1:
                        print(f"  [INFO] Request {i}: {response.status_code}")
                
            except Exception as e:
                print(f"  [ERROR] Request {i}: {str(e)[:50]}")
                return False
            
            await asyncio.sleep(0.05)
        
        print("-" * 60)
        print(f"Results:")
        print(f"   Allowed: {success_count}/50")
        print(f"   Expected: All 50 allowed (limite: 5000/hora)")
        print("-" * 60)
        
        if success_count == 50:
            print("[PASS] IP rate limit test PASSED!")
            print("       Limite 5000/hora permite registros masivos")
            return True
        else:
            print(f"[FAIL] Expected all 50 allowed, got {success_count}")
            return False


async def test_register_rate_limit_by_email():
    print("\nTest 2: Rate Limit por Email (mismo email, 3 intentos)")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        test_email = "duplicate@example.com"
        success_count = 0
        blocked_count = 0
        
        for i in range(1, 6):
            register_data = {
                "email": test_email,
                "contrasena": "Password123!",
                "numero_documento": f"{20000000 + i}"
            }
            try:
                response = await client.post(
                    f"{BASE_URL}/usuarios/register",
                    json=register_data,
                    timeout=5.0
                )
                
                if response.status_code == 429:
                    blocked_count += 1
                    print(f"  [BLOCKED] Request {i}: 429")
                    if blocked_count == 1:
                        headers = response.headers
                        print(f"     Retry-After: {headers.get('retry-after')} seconds")
                        print(f"     Limit: {headers.get('x-ratelimit-limit')}")
                else:
                    success_count += 1
                    print(f"  [ALLOWED] Request {i}: {response.status_code}")
                
            except Exception as e:
                print(f"  [ERROR] Request {i}: {str(e)[:50]}")
            
            await asyncio.sleep(0.1)
        
        print("-" * 60)
        print(f"Results:")
        print(f"   Allowed: {success_count}")
        print(f"   Blocked: {blocked_count}")
        print(f"   Expected: 3 allowed, 2 blocked")
        print("-" * 60)
        
        if blocked_count >= 2 and success_count == 3:
            print("[PASS] Email rate limit test PASSED!")
            return True
        else:
            print(f"[FAIL] Expected 3 allowed + 2 blocked, got {success_count} allowed + {blocked_count} blocked")
            return False


async def test_register_independent_emails():
    print("\nTest 3: Verificar que cada email tiene su propio limite")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        emails = ["alice@example.com", "bob@example.com", "charlie@example.com"]
        
        for idx, email in enumerate(emails):
            print(f"  Testing {email}...")
            for i in range(1, 4):
                register_data = {
                    "email": email,
                    "contrasena": "Password123!",
                    "numero_documento": f"{30000000 + (idx * 10) + i}"
                }
                response = await client.post(
                    f"{BASE_URL}/usuarios/register",
                    json=register_data,
                    timeout=5.0
                )
                
                if response.status_code in [201, 200, 400]:
                    print(f"    Request {i}: Allowed ({response.status_code})")
                else:
                    print(f"    [FAIL] Request {i} should be allowed")
                    return False
                
                await asyncio.sleep(0.1)
        
        print("-" * 60)
        print("[PASS] Independent email counters test PASSED!")
        print("       Cada email tiene su propio limite")
        return True


async def main():
    print("=" * 60)
    print("REGISTER RATE LIMITING TESTS")
    print("=" * 60)
    print()
    
    test_results = []
    
    try:
        result1 = await test_register_rate_limit_by_ip()
        test_results.append(result1)
        
        await asyncio.sleep(2)
        
        result2 = await test_register_rate_limit_by_email()
        test_results.append(result2)
        
        await asyncio.sleep(2)
        
        result3 = await test_register_independent_emails()
        test_results.append(result3)
        
        print("\n" + "=" * 60)
        print("SUMMARY:")
        print(f"  Test 1 (IP limit): {'PASS' if test_results[0] else 'FAIL'}")
        print(f"  Test 2 (Email limit): {'PASS' if test_results[1] else 'FAIL'}")
        print(f"  Test 3 (Independent): {'PASS' if test_results[2] else 'FAIL'}")
        print("=" * 60)
        
        if all(test_results):
            print("[SUCCESS] ALL TESTS PASSED!")
            print("\nRate limiting para registro implementado:")
            print("   - 5000 registros/hora por IP")
            print("   - 3 intentos/hora por email")
            print("   - Soporta eventos masivos")
        else:
            print("[FAILURE] SOME TESTS FAILED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] TEST SUITE FAILED: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())

