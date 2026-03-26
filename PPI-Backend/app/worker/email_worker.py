import asyncio
import json
import logging
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import AsyncSessionLocal
from app.core.infrastructure.redis_client import redis_client
from app.repositories.eventos import EventoRepository
from app.repositories.auth import ClienteRepository
from app.utils.email.email_service import send_email
from app.utils.email.templates import evento_cancelacion_html
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailWorkerConfig:
    QUEUE_KEY = "email_queue:cancelacion_evento"
    BATCH_SIZE = getattr(settings, 'EMAIL_BATCH_SIZE', 250)
    CONCURRENT_LIMIT = getattr(settings, 'EMAIL_CONCURRENT_LIMIT', 50)
    BATCH_DELAY = getattr(settings, 'EMAIL_BATCH_DELAY', 1.0)
    POLL_INTERVAL = getattr(settings, 'EMAIL_POLL_INTERVAL', 2.0)
    MAX_RETRIES = getattr(settings, 'EMAIL_MAX_RETRIES', 3)


async def get_cliente_email(session: AsyncSession, cliente_id: int) -> Optional[str]:
    try:
        cliente_repo = ClienteRepository(session)
        cliente = await cliente_repo.get_by_id(cliente_id)
        if cliente and hasattr(cliente, 'usuario') and cliente.usuario:
            return getattr(cliente.usuario, 'email', None)
        return None
    except Exception as e:
        logger.error(f"Error obteniendo email del cliente {cliente_id}: {e}")
        return None


async def get_evento_data(session: AsyncSession, evento_id: int) -> Optional[Dict]:
    try:
        evento_repo = EventoRepository(session)
        evento = await evento_repo.get_by_id(evento_id)
        if not evento:
            return None
        
        fecha_str = ""
        if evento.fecha_hora_inicio:
            try:
                fecha_str = evento.fecha_hora_inicio.strftime('%d/%m/%Y %H:%M')
            except:
                fecha_str = str(evento.fecha_hora_inicio)
        
        local_nombre = None
        if evento.local:
            local_nombre = evento.local.nombre
        
        return {
            "nombre": evento.nombre,
            "fecha": fecha_str,
            "local_nombre": local_nombre
        }
    except Exception as e:
        logger.error(f"Error obteniendo datos del evento {evento_id}: {e}")
        return None


async def send_cancelacion_email(semaphore: asyncio.Semaphore, session: AsyncSession, job_data: Dict) -> bool:
    async with semaphore:
        evento_id = job_data.get("evento_id")
        cliente_id = job_data.get("cliente_id")
        
        if not evento_id or not cliente_id:
            return False
        
        try:
            email = await get_cliente_email(session, cliente_id)
            if not email:
                logger.warning(f"Cliente {cliente_id} no tiene email configurado")
                return False
            
            evento_data = await get_evento_data(session, evento_id)
            if not evento_data:
                logger.warning(f"Evento {evento_id} no encontrado")
                return False
            
            subject = f"Evento Cancelado: {evento_data['nombre']}"
            frontend_url = settings.FRONTEND_URL.rstrip("/") if settings.FRONTEND_URL else ""
            tickets_url = f"{frontend_url}/tickets" if frontend_url else None
            evento_url = f"{frontend_url}/evento/{evento_id}" if frontend_url else None
            body = evento_cancelacion_html(
                evento_nombre=evento_data['nombre'],
                evento_fecha=evento_data['fecha'],
                local_nombre=evento_data.get('local_nombre'),
                tickets_url=tickets_url,
                evento_url=evento_url,
            )
            
            await send_email(
                to_email=email,
                subject=subject,
                body=body,
                plain_text_body=f"El evento {evento_data['nombre']} ha sido cancelado. Se ha habilitado el proceso de reembolso."
            )
            
            logger.info(f"Correo de cancelación enviado a {email} para evento {evento_id}")
            return True
        except Exception as e:
            logger.error(f"Error enviando correo de cancelación a cliente {cliente_id}: {e}")
            return False


async def process_batch(session: AsyncSession, jobs: List[Dict], semaphore: asyncio.Semaphore) -> int:
    if not jobs:
        return 0
    
    tasks = [send_cancelacion_email(semaphore, session, job) for job in jobs]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    successful = sum(1 for r in results if r is True)
    failed = len(jobs) - successful
    
    if failed > 0:
        logger.warning(f"Fallaron {failed} de {len(jobs)} correos en el batch")
    
    return successful


async def fetch_jobs_from_redis(count: int) -> List[Dict]:
    if not await redis_client.is_connected():
        return []
    
    try:
        jobs = []
        for _ in range(count):
            job_str = await redis_client.client.rpop(EmailWorkerConfig.QUEUE_KEY)
            if not job_str:
                break
            try:
                job = json.loads(job_str)
                jobs.append(job)
            except json.JSONDecodeError as e:
                logger.error(f"Error decodificando job: {e}")
        return jobs
    except Exception as e:
        logger.error(f"Error obteniendo jobs de Redis: {e}")
        return []


async def worker_loop():
    logger.info(f"Email worker iniciado (batch={EmailWorkerConfig.BATCH_SIZE}, concurrent={EmailWorkerConfig.CONCURRENT_LIMIT}, delay={EmailWorkerConfig.BATCH_DELAY}s)")
    
    semaphore = asyncio.Semaphore(EmailWorkerConfig.CONCURRENT_LIMIT)
    
    while True:
        if not await redis_client.is_connected():
            logger.warning("Redis no conectado, esperando...")
            await asyncio.sleep(EmailWorkerConfig.POLL_INTERVAL)
            continue
        
        queue_length = await redis_client.client.llen(EmailWorkerConfig.QUEUE_KEY)
        
        if queue_length == 0:
            await asyncio.sleep(EmailWorkerConfig.POLL_INTERVAL)
            continue
        
        jobs = await fetch_jobs_from_redis(EmailWorkerConfig.BATCH_SIZE)
        
        if not jobs:
            await asyncio.sleep(EmailWorkerConfig.POLL_INTERVAL)
            continue
        
        async with AsyncSessionLocal() as session:
            try:
                successful = await process_batch(session, jobs, semaphore)
                await session.commit()
                
                if successful > 0:
                    logger.info(f"{successful} correo(s) de cancelación enviado(s) exitosamente")
                
                await asyncio.sleep(EmailWorkerConfig.BATCH_DELAY)
            except Exception as e:
                await session.rollback()
                logger.error(f"Error en worker de email: {e}", exc_info=True)
                await asyncio.sleep(EmailWorkerConfig.POLL_INTERVAL)


def run():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
    logger.info("Iniciando email worker...")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(worker_loop())
    except KeyboardInterrupt:
        logger.info("Email worker detenido por usuario")
    except Exception as e:
        logger.error(f"Error fatal en email worker: {e}", exc_info=True)
    finally:
        loop.close()
        logger.info("Email worker cerrado")


if __name__ == '__main__':
    run()

