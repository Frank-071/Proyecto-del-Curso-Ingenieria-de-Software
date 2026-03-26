"""
Configuración global de fixtures para tests unitarios.

Este archivo contiene fixtures compartidas entre todos los tests unitarios.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def mock_db() -> AsyncMock:
    """
    Mock de AsyncSession de SQLAlchemy.
    
    Simula una sesión de base de datos para tests sin conexión real.
    """
    db = AsyncMock(spec=AsyncSession)
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.close = AsyncMock()
    return db


@pytest.fixture
def mock_redis() -> MagicMock:
    """
    Mock de cliente Redis.
    
    Simula operaciones de Redis sin conexión real.
    """
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.setex = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=True)
    return redis

