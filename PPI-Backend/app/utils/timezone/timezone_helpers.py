import httpx
import logging
from typing import Optional, Tuple, Dict
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)

def is_private_ip(ip: str) -> bool:
    if not ip or ip == "unknown":
        return True
    
    if ip == "::1":
        return True
    
    if ip.startswith("fc00:") or ip.startswith("fe80:"):
        return True
    
    parts = ip.split(".")
    if len(parts) != 4:
        return False
    
    try:
        first = int(parts[0])
        second = int(parts[1])
        
        if first == 127:
            return True
        
        if first == 10:
            return True
        
        if first == 192 and second == 168:
            return True
        
        if first == 169 and second == 254:
            return True
        
        if first == 172 and 16 <= second <= 31:
            return True
        
        return False
    except (ValueError, IndexError):
        return False

async def get_location_from_ip(ip: str) -> Optional[Dict[str, str]]:
    if is_private_ip(ip):
        return None
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(
                f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,timezone,offset"
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "country": data.get("country", ""),
                        "countryCode": data.get("countryCode", ""),
                        "city": data.get("city", ""),
                        "timezone": data.get("timezone", ""),
                        "offset": data.get("offset", 0)
                    }
    except Exception as e:
        logger.debug(f"Error obteniendo ubicación desde IP {ip}: {e}")
    
    return None

def format_datetime_with_timezone(utc_datetime: datetime, timezone_str: Optional[str] = None, offset: Optional[int] = None) -> Tuple[str, str]:
    utc_str = utc_datetime.strftime("%d/%m/%Y %H:%M:%S UTC")
    
    if timezone_str:
        try:
            tz = pytz.timezone(timezone_str)
            local_time = utc_datetime.replace(tzinfo=pytz.UTC).astimezone(tz)
            
            if offset is not None:
                offset_str = f"UTC{offset:+d}" if offset != 0 else "UTC"
                local_str = local_time.strftime(f"%d/%m/%Y %H:%M:%S {offset_str}")
            else:
                local_str = local_time.strftime("%d/%m/%Y %H:%M:%S %Z")
            
            return utc_str, local_str
        except Exception as e:
            logger.debug(f"Error convirtiendo timezone {timezone_str}: {e}")
    
    return utc_str, None

