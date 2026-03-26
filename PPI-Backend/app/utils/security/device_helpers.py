import hashlib
from fastapi import Request
from typing import Dict

def generate_device_hash(user_agent: str, ip: str) -> str:
    device_string = f"{user_agent}:{ip}".lower().strip()
    return hashlib.sha256(device_string.encode('utf-8')).hexdigest()

def extract_device_info(request: Request) -> Dict[str, str]:
    user_agent = request.headers.get("user-agent", "unknown")
    forwarded = request.headers.get("X-Forwarded-For")
    
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    device_hash = generate_device_hash(user_agent, ip)
    
    return {
        "user_agent": user_agent,
        "ip": ip,
        "device_hash": device_hash
    }

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

