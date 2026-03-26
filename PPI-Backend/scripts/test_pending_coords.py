import asyncio
import os
import httpx

BASE_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

async def main(limit=5):
    url = f"{BASE_URL}/local/test/pending-coords?limit={limit}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        print("Status:", resp.status_code)
        try:
            data = resp.json()
        except Exception:
            print(resp.text)
            return
        print(data)

if __name__ == '__main__':
    asyncio.run(main())
