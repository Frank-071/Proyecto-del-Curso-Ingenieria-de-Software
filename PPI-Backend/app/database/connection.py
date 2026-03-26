from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.get_async_database_url(),
    pool_pre_ping=settings.DATABASE_POOL_PRE_PING,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_recycle=settings.DATABASE_POOL_RECYCLE,
    echo=settings.DATABASE_ECHO
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def test_connection():
    try:
        async with engine.connect():
            return True, "Database connection successful!"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"