import argparse
import asyncio
import logging
import time
import gc
from typing import Optional
import sys
from pathlib import Path

# ensure project root is on sys.path so `from app...` imports work when running from repo root
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database.connection import AsyncSessionLocal, engine
from app.repositories.locales.local_repository import LocalRepository
from app.services.geocoding.geocode_service import geocode_address
from app.core.infrastructure import redis_client

logger = logging.getLogger("geocode_batch")
logging.basicConfig(level=logging.INFO)

# Default values
BATCH_LIMIT = 100
SLEEP_BETWEEN = 1.0  # seconds between items as extra protection


async def process_batch(
    limit: int = BATCH_LIMIT,
    batch_size: int = 25,
    dry_run: bool = False,
    sleep_between: float = SLEEP_BETWEEN,
    include_country: bool = False,
):
    """
    Paginate through pending locales (latitud/longitud is null) and geocode each one.

    - limit: max total items to process (None or 0 => process all)
    - batch_size: how many items to fetch per DB call
    - dry_run: if True, don't persist updates (just log)
    - sleep_between: seconds to sleep between processing each item
    """
    processed = 0
    updated = 0
    failed = 0
    start_time = time.time()

    async with AsyncSessionLocal() as session:
        repo = LocalRepository(session)

        offset = 0
        while True:
            remaining = None if not limit else max(0, limit - processed)
            fetch_limit = batch_size if (remaining is None or remaining == 0) else min(batch_size, remaining)

            pending = await repo.list_where_lat_null(skip=offset, limit=fetch_limit)
            if not pending:
                logger.info("No more pending locales to process.")
                break

            logger.info(f"Fetched {len(pending)} pending locales (offset={offset}, fetch_limit={fetch_limit})")

            for local in pending:
                if limit and processed >= limit:
                    logger.info("Reached processing limit")
                    break

                processed += 1

                try:
                    distrito_nombre = getattr(local.distrito, "nombre", None) if getattr(local, 'distrito', None) else None
                    provincia_nombre = None
                    if getattr(local, 'distrito', None) and getattr(local.distrito, 'provincia', None):
                        provincia_nombre = getattr(local.distrito.provincia, 'nombre', None)

                    parts = [getattr(local, 'direccion', None), distrito_nombre, provincia_nombre]
                    if include_country:
                        parts.append("Peru")
                    query = ", ".join([p for p in parts if p])

                    logger.info(f"Geocoding local id={local.id} query='{query}'")
                    coords = await geocode_address(query)

                    if coords:
                        lat, lon = coords
                        if dry_run:
                            logger.info(f"[dry-run] Would update local id={local.id} with coords: {lat},{lon}")
                        else:
                            await repo.update(local.id, {"latitud": lat, "longitud": lon})
                            updated += 1
                            logger.info(f"Updated local id={local.id} with coords: {lat},{lon}")
                    else:
                        failed += 1
                        logger.warning(f"Geocoding returned no coords for local id={local.id} query='{query}'")

                except Exception as e:
                    failed += 1
                    logger.exception(f"Error processing local id={getattr(local, 'id', None)}: {e}")

                # small sleep to give breathing room between requests
                if sleep_between and sleep_between > 0:
                    await asyncio.sleep(sleep_between)

            # advance pagination
            offset += len(pending)

            # if limit reached, stop
            if limit and processed >= limit:
                logger.info("Reached overall limit; stopping pagination")
                break

        elapsed = time.time() - start_time
        logger.info(
            f"Finished geocode batch: processed={processed}, updated={updated}, failed={failed}, elapsed={elapsed:.2f}s"
        )

        # Attempt to gracefully dispose of DB engine and close Redis client
        try:
            # AsyncEngine.dispose may be a coroutine in some SQLAlchemy versions
            if hasattr(engine, 'dispose'):
                maybe_coro = engine.dispose()
                if asyncio.iscoroutine(maybe_coro):
                    await maybe_coro
                else:
                    # dispose returned synchronously
                    pass
                logger.info("Disposed DB engine")
        except Exception as e:
            logger.debug(f"Error disposing DB engine: {e}")

        try:
            # Prefer async aclose() if available (newer redis clients); fallback to close()
            if hasattr(redis_client, 'client'):
                aclose = getattr(redis_client.client, 'aclose', None)
                if aclose and asyncio.iscoroutinefunction(aclose):
                    await redis_client.client.aclose()
                else:
                    close = getattr(redis_client.client, 'close', None)
                    if close:
                        maybe = close()
                        if asyncio.iscoroutine(maybe):
                            await maybe
                logger.info("Closed redis client")
        except Exception as e:
            logger.debug(f"Error closing redis client: {e}")
        # Allow pending destructors (aiomysql.Connection.__del__) to run while the loop is still open
        try:
            gc.collect()
            # small sleep to allow __del__ handlers to run
            if asyncio and hasattr(asyncio, 'sleep'):
                await asyncio.sleep(0.1)
        except Exception as e:
            logger.debug(f"Error during final gc/sleep: {e}")


async def main(limit: Optional[int] = None, batch_size: int = 25, dry_run: bool = False, sleep_between: float = SLEEP_BETWEEN, include_country: bool = True):
    await process_batch(limit=limit or 0, batch_size=batch_size, dry_run=dry_run, sleep_between=sleep_between, include_country=include_country)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch geocode locales missing lat/lng")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of items to process (0 = all)")
    parser.add_argument("--batch-size", type=int, default=25, help="How many items to fetch per DB call")
    parser.add_argument("--sleep", type=float, default=SLEEP_BETWEEN, help="Seconds to sleep between items")
    parser.add_argument("--dry-run", action="store_true", help="Do not persist updates; just log actions")
    # Backwards-compatible flags: prefer explicit --with-country to append the country; default is to NOT append
    parser.add_argument("--no-country", dest="no_country", action="store_true", help="(deprecated) Do not append country name to geocode query")
    parser.add_argument("--with-country", dest="with_country", action="store_true", help="Append country name (Peru) to geocode query")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    # limit 0 -> interpret as no limit
    limit_arg = args.limit if args.limit and args.limit > 0 else 0
    # Determine country inclusion: explicit --with-country overrides --no-country; default is False (no country appended)
    if getattr(args, 'with_country', False):
        include_country = True
    elif getattr(args, 'no_country', False):
        include_country = False
    else:
        include_country = False
    asyncio.run(main(limit=limit_arg, batch_size=args.batch_size, dry_run=args.dry_run, sleep_between=args.sleep, include_country=include_country))
