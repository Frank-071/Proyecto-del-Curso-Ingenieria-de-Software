import jwt
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.core.exceptions import BusinessError
from app.core.config import settings

def create_access_token(
    user_id: int,
    email: str,
    role: str,
    admin_type: Optional[str] = None,
    expires_minutes: Optional[int] = None,
    session_version: Optional[int] = None,
    jti: Optional[str] = None,
    **kwargs
) -> str:
    if expires_minutes is None:
        expires_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    
    if session_version is None:
        session_version = 1
    
    if jti is None:
        jti = str(uuid.uuid4())
    
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
        "session_version": session_version,
        "jti": jti
    }
    payload.update(kwargs)
    
    if role == "admin" and admin_type:
        payload["admin_type"] = admin_type
    
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise BusinessError("Token expirado", 400)
    except jwt.InvalidTokenError:
        raise BusinessError("Token inválido", 400)