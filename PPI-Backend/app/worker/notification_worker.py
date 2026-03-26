import asyncio
import logging
from datetime import datetime, timezone
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import AsyncSessionLocal
from app.repositories.eventos.notificacion_repository import NotificacionRepository
from app.services.eventos.notificacion_service import NotificacionService
from app.core.config import settings

logger = logging.getLogger(__name__)


class WorkerConfig:
    BATCH_SIZE = getattr(settings, 'NOTIFICATION_BATCH_SIZE', 50)
    POLL_INTERVAL = getattr(settings, 'NOTIFICATION_POLL_INTERVAL', 10)
    MAX_ATTEMPTS = getattr(settings, 'NOTIFICATION_MAX_ATTEMPTS', 5)


async def process_batch(session: AsyncSession, batch_size: int):
    repo = NotificacionRepository(session)
    service = NotificacionService(session)

    notifs = await repo.fetch_pending_batch(limit=batch_size)
    if not notifs:
        return 0

    processed = 0
    for n in notifs:
        try:
            await service.process_notification(n)
            processed += 1
        except Exception as exc:
            attempts, max_attempts = await repo.increment_attempts(n.id, last_error=str(exc))
            if max_attempts and attempts >= max_attempts:
                await repo.mark_sent(n.id, processed_at=datetime.now(timezone.utc).replace(tzinfo=None))
    return processed


async def worker_loop():
    logger.info(f"Worker de notificaciones iniciado (poll cada {WorkerConfig.POLL_INTERVAL}s, batch={WorkerConfig.BATCH_SIZE})")
    while True:
        async with AsyncSessionLocal() as session:
            try:
                processed = await process_batch(session, WorkerConfig.BATCH_SIZE)
                await session.commit()
                
                if processed > 0:
                    logger.info(f"{processed} notificacion(es) procesada(s) exitosamente")
                
                await asyncio.sleep(WorkerConfig.POLL_INTERVAL)
            except Exception as e:
                await session.rollback()
                logger.error(f"Worker error: {e}", exc_info=True)
                await asyncio.sleep(WorkerConfig.POLL_INTERVAL)


def run():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
    logger.info("Iniciando worker de notificaciones...")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(worker_loop())
    except KeyboardInterrupt:
        logger.info("Worker detenido por usuario")
    except Exception as e:
        logger.error(f"Error fatal en worker: {e}", exc_info=True)
    finally:
        loop.close()
        logger.info("Worker cerrado")


if __name__ == '__main__':
    run()
