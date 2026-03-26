import json
import logging
from typing import List, Dict
from app.core.infrastructure.redis_client import redis_client

logger = logging.getLogger(__name__)


class EmailQueueService:
    QUEUE_KEY = "email_queue:cancelacion_evento"
    
    @staticmethod
    async def enqueue_cancelacion_evento(evento_id: int, cliente_ids: List[int]) -> int:
        if not cliente_ids:
            return 0
        
        jobs = []
        for cliente_id in cliente_ids:
            job = {
                "evento_id": evento_id,
                "cliente_id": cliente_id,
                "type": "cancelacion_evento"
            }
            jobs.append(json.dumps(job))
        
        if not await redis_client.is_connected():
            logger.error("Redis no está conectado, no se pueden encolar correos")
            return 0
        
        try:
            if jobs:
                await redis_client.client.lpush(EmailQueueService.QUEUE_KEY, *jobs)
                logger.info(f"Encolados {len(jobs)} correos de cancelación para evento {evento_id}")
            return len(jobs)
        except Exception as e:
            logger.error(f"Error encolando correos de cancelación: {e}")
            return 0
    
    @staticmethod
    async def get_queue_length() -> int:
        if not await redis_client.is_connected():
            return 0
        try:
            return await redis_client.client.llen(EmailQueueService.QUEUE_KEY)
        except Exception as e:
            logger.error(f"Error obteniendo longitud de cola: {e}")
            return 0

