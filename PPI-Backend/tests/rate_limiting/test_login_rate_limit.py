import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:8000"


async def test_login_rate_limit_by_email_single():
    print("Test 1: Rate Limit por Email (mismo email, múltiples intentos)")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        test_email = "test.user@example.com"
        login_data = {
            "email": test_email,
            "contrasena": "wrongpassword"
        }
        
        success_count = 0
        blocked_count = 0
        
        for i in range(1, 10):
            try:
                response = await client.post(
                    f"{BASE_URL}/usuarios/login",
                    json=login_data,
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
        print(f"   Expected: 5 allowed, 4 blocked")
        print("-" * 60)
        
        if blocked_count >= 4 and success_count == 5:
            print("[PASS] Rate limit por email test PASSED!")
            return True
        else:
            print(f"[FAIL] Expected 5 allowed + 4 blocked, got {success_count} allowed + {blocked_count} blocked")
            return False


async def test_login_rate_limit_multiple_emails():
    print("\nTest 2: Múltiples emails desde misma IP (sin límite de IP)")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        success_count = 0
        
        for i in range(1, 51):
            login_data = {
                "email": f"user{i}@example.com",
                "contrasena": "wrongpassword"
            }
            try:
                response = await client.post(
                    f"{BASE_URL}/usuarios/login",
                    json=login_data,
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
        print(f"   Total requests: 50 (50 different emails)")
        print(f"   Allowed: {success_count}")
        print(f"   Expected: All 50 allowed (no IP limiter)")
        print("-" * 60)
        
        if success_count == 50:
            print("[PASS] Multiple emails test PASSED!")
            print("       Sin límite de IP, solo por email")
            return True
        else:
            print(f"[FAIL] Expected all 50 allowed, got {success_count}")
            return False


async def test_login_rate_limit_per_email_independent():
    print("\nTest 3: Verificar que cada email tiene su propio límite")
    print(f"Started at: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        email1 = "alice@example.com"
        email2 = "bob@example.com"
        
        print(f"  Testing {email1}...")
        for i in range(1, 7):
            response = await client.post(
                f"{BASE_URL}/usuarios/login",
                json={"email": email1, "contrasena": "wrong"},
                timeout=5.0
            )
            if i <= 5:
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
        for i in range(1, 6):
            response = await client.post(
                f"{BASE_URL}/usuarios/login",
                json={"email": email2, "contrasena": "wrong"},
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
    print("LOGIN RATE LIMITING TESTS (EMAIL-ONLY)")
    print("=" * 60)
    print()
    
    test_results = []
    
    try:
        result1 = await test_login_rate_limit_by_email_single()
        test_results.append(result1)
        
        await asyncio.sleep(2)
        
        result2 = await test_login_rate_limit_multiple_emails()
        test_results.append(result2)
        
        await asyncio.sleep(2)
        
        result3 = await test_login_rate_limit_per_email_independent()
        test_results.append(result3)
        
        print("\n" + "=" * 60)
        print("SUMMARY:")
        print(f"  Test 1 (Email limit): {'PASS' if test_results[0] else 'FAIL'}")
        print(f"  Test 2 (No IP limit): {'PASS' if test_results[1] else 'FAIL'}")
        print(f"  Test 3 (Independent): {'PASS' if test_results[2] else 'FAIL'}")
        print("=" * 60)
        
        if all(test_results):
            print("[SUCCESS] ALL TESTS PASSED!")
            print("\nRate limiting profesional implementado:")
            print("   - 5 intentos por email")
            print("   - Sin límite de IP")
            print("   - Compatible con IPs compartidas")
        else:
            print("[FAILURE] SOME TESTS FAILED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] TEST SUITE FAILED: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())

