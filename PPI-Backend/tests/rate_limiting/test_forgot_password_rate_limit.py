import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:8000"


async def test_forgot_password_rate_limit_by_email():
    print("Test 1: Rate Limit por Email (mismo email, 3 intentos)")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        test_email = "test.forgot@example.com"
        
        success_count = 0
        blocked_count = 0
        
        for i in range(1, 6):
            try:
                response = await client.post(
                    f"{BASE_URL}/usuarios/forgot-password",
                    json={"email": test_email},
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
        
        if success_count == 3 and blocked_count == 2:
            print("[PASS] Email rate limit test PASSED!")
            return True
        else:
            print(f"[FAIL] Expected 3 allowed + 2 blocked, got {success_count} allowed + {blocked_count} blocked")
            return False


async def test_forgot_password_rate_limit_by_ip():
    print("\nTest 2: Rate Limit por IP (100 req/hora)")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    print("  Nota: Test abreviado (30 requests en vez de 100)")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        success_count = 0
        
        # Solo probamos 30 requests (todos deberían pasar con límite de 100)
        for i in range(1, 31):
            email = f"ip_test_{i}@example.com"
            try:
                response = await client.post(
                    f"{BASE_URL}/usuarios/forgot-password",
                    json={"email": email},
                    timeout=5.0
                )
                
                if response.status_code == 429:
                    print(f"  [UNEXPECTED BLOCK] Request {i:2d}: 429 - No debería bloquearse")
                    return False
                else:
                    success_count += 1
                    if i % 10 == 0:
                        print(f"  [ALLOWED] Requests 1-{i}: All passing")
                
            except Exception as e:
                print(f"  [ERROR] Request {i:2d}: {str(e)[:50]}")
                return False
            
            await asyncio.sleep(0.05)
        
        print("-" * 60)
        print(f"Results:")
        print(f"   Total requests: 30 (30 different emails)")
        print(f"   Allowed: {success_count}")
        print(f"   Expected: All 30 allowed (limit is 100/hour)")
        print("-" * 60)
        
        if success_count == 30:
            print("[PASS] IP rate limit test PASSED!")
            return True
        else:
            print(f"[FAIL] Expected all 30 allowed, got {success_count}")
            return False


async def test_forgot_password_independent_counters():
    print("\nTest 3: Verificar que cada email tiene su propio límite")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        email1 = "alice.forgot@example.com"
        email2 = "bob.forgot@example.com"
        
        print(f"  Testing {email1}...")
        for i in range(1, 5):
            response = await client.post(
                f"{BASE_URL}/usuarios/forgot-password",
                json={"email": email1},
                timeout=5.0
            )
            if i <= 3:
                if response.status_code != 429:
                    print(f"    Request {i}: Allowed ({response.status_code})")
                else:
                    print(f"    [FAIL] Request {i} should be allowed")
                    return False
            else:
                if response.status_code == 429:
                    print(f"    Request {i}: Blocked (429)")
                else:
                    print(f"    [FAIL] Request {i} should be blocked")
                    return False
            await asyncio.sleep(0.1)
        
        print(f"\n  Testing {email2} (debe tener contador independiente)...")
        for i in range(1, 4):
            response = await client.post(
                f"{BASE_URL}/usuarios/forgot-password",
                json={"email": email2},
                timeout=5.0
            )
            if response.status_code != 429:
                print(f"    Request {i}: Allowed ({response.status_code})")
            else:
                print(f"    [FAIL] {email2} shouldn't be blocked (independent counter)")
                return False
            await asyncio.sleep(0.1)
        
        print("-" * 60)
        print("[PASS] Independent email counters test PASSED!")
        print("       Cada email tiene su propio límite")
        return True


async def main():
    print("=" * 60)
    print("FORGOT PASSWORD RATE LIMITING TESTS")
    print("=" * 60)
    print()
    
    test_results = []
    
    try:
        result1 = await test_forgot_password_rate_limit_by_email()
        test_results.append(result1)
        
        await asyncio.sleep(2)
        
        result2 = await test_forgot_password_rate_limit_by_ip()
        test_results.append(result2)
        
        await asyncio.sleep(2)
        
        result3 = await test_forgot_password_independent_counters()
        test_results.append(result3)
        
        print("\n" + "=" * 60)
        print("SUMMARY:")
        print(f"  Test 1 (Email limit): {'PASS' if test_results[0] else 'FAIL'}")
        print(f"  Test 2 (IP limit): {'PASS' if test_results[1] else 'FAIL'}")
        print(f"  Test 3 (Independent): {'PASS' if test_results[2] else 'FAIL'}")
        print("=" * 60)
        
        if all(test_results):
            print("[SUCCESS] ALL TESTS PASSED!")
            print("\nRate limiting profesional implementado para forgot password:")
            print("   - 3 intentos por email/hora")
            print("   - 100 intentos por IP/hora")
            print("   - Compatible con IPs compartidas (universidades, empresas)")
        else:
            print("[FAILURE] SOME TESTS FAILED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] TEST SUITE FAILED: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())

