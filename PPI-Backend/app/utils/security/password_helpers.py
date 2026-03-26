import asyncio
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def hash_password(password: str) -> str:
    if not password:
        raise ValueError("La contraseña no puede estar vacía")
    truncated_password = password[:72]
    # Ejecuta bcrypt en thread pool, liberando el event loop
    return await asyncio.to_thread(pwd_context.hash, truncated_password)

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    truncated_password = plain_password[:72]
    # Ejecuta bcrypt en thread pool, liberando el event loop
    return await asyncio.to_thread(pwd_context.verify, truncated_password, hashed_password)