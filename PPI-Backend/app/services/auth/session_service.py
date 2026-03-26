import json
import logging
from typing import Dict, Optional
from datetime import datetime, timezone
from app.core.infrastructure import redis_client

logger = logging.getLogger(__name__)

class SessionService:
    def __init__(self):
        self.redis = redis_client.client
    
    async def get_session_version(self, user_id: int) -> int:
        try:
            key = f"user:{user_id}:session_version"
            version = await self.redis.get(key)
            if version:
                logger.debug(f"SESSION | GET_VERSION | User ID: {user_id} | Version: {version}")
                return int(version)
            logger.debug(f"SESSION | GET_VERSION | User ID: {user_id} | Version: 1 (default)")
            return 1
        except Exception as e:
            logger.error(f"Error obteniendo session_version para usuario {user_id}: {e}")
            return 1
    
    async def invalidate_all_sessions(self, user_id: int) -> int:
        try:
            key = f"user:{user_id}:session_version"
            current_version = await self.redis.get(key)
            
            if current_version is None:
                new_version = 2
                await self.redis.set(key, new_version)
            else:
                new_version = await self.redis.incr(key)
            
            logger.info(f"SECURITY | SESSIONS_INVALIDATED | User ID: {user_id} | New version: {new_version}")
            return new_version
        except Exception as e:
            logger.error(f"Error invalidando sesiones para usuario {user_id}: {e}")
            raise
    
    async def get_known_devices(self, user_id: int) -> Dict[str, Dict]:
        try:
            key = f"user:{user_id}:devices"
            devices = await self.redis.hgetall(key)
            result = {}
            for device_hash, device_data_str in devices.items():
                try:
                    result[device_hash] = json.loads(device_data_str)
                except json.JSONDecodeError:
                    logger.warning(f"Error decodificando dispositivo {device_hash} para usuario {user_id}")
            return result
        except Exception as e:
            logger.error(f"Error obteniendo dispositivos conocidos para usuario {user_id}: {e}")
            return {}
    
    async def save_known_device(
        self, 
        user_id: int, 
        device_hash: str, 
        device_data: Dict,
        session_version: int
    ) -> bool:
        try:
            key = f"user:{user_id}:devices"
            device_data["session_version"] = session_version
            device_data["last_seen"] = datetime.now(timezone.utc).isoformat()
            
            if "first_seen" not in device_data:
                device_data["first_seen"] = datetime.now(timezone.utc).isoformat()
            
            device_json = json.dumps(device_data, ensure_ascii=False)
            await self.redis.hset(key, device_hash, device_json)
            return True
        except Exception as e:
            logger.error(f"Error guardando dispositivo {device_hash} para usuario {user_id}: {e}")
            return False
    
    async def is_suspicious_device(
        self, 
        user_id: int, 
        device_hash: str, 
        device_data: Dict,
        known_devices: Optional[Dict[str, Dict]] = None
    ) -> bool:
        try:
            if known_devices is None:
                known_devices = await self.get_known_devices(user_id)
            
            if device_hash in known_devices:
                return False
            
            if len(known_devices) == 0:
                return False
            
            return True
        except Exception as e:
            logger.error(f"Error verificando dispositivo sospechoso para usuario {user_id}: {e}")
            return False
    
    async def get_session_data(self, user_id: int) -> tuple[int, Dict[str, Dict]]:
        try:
            pipe = self.redis.pipeline()
            pipe.get(f"user:{user_id}:session_version")
            pipe.hgetall(f"user:{user_id}:devices")
            results = await pipe.execute()
            
            session_version = int(results[0]) if results[0] else 1
            devices_raw = results[1] or {}
            
            devices = {}
            for device_hash, device_data_str in devices_raw.items():
                try:
                    devices[device_hash] = json.loads(device_data_str)
                except json.JSONDecodeError:
                    logger.warning(f"Error decodificando dispositivo {device_hash} para usuario {user_id}")
            
            logger.debug(f"SESSION | GET_DATA | User ID: {user_id} | Session Version: {session_version} | Devices Count: {len(devices)}")
            return session_version, devices
        except Exception as e:
            logger.error(f"Error obteniendo datos de sesión para usuario {user_id}: {e}")
            return 1, {}

