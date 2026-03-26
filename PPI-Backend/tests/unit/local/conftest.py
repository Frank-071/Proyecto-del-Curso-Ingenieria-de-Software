import pytest
from datetime import datetime
from types import SimpleNamespace


@pytest.fixture
def mock_local():
    """
    Mock de un local con relaciones completas.
    Simula el modelo ORM que devuelve SQLAlchemy.
    """
    tipo_local = SimpleNamespace(
        id=2,
        nombre="Restaurante"
    )

    distrito = SimpleNamespace(
        id=10,
        nombre="Cusco Centro"
    )

    local = SimpleNamespace(
        id=1,
        nombre="Local de prueba",
        direccion="Av. Principal 123",
        distrito_id=10,
        tipo_local_id=2,
        activo=True,
        fecha_creacion=datetime.now(),
        tipo_local=tipo_local,
        distrito=distrito
    )

    return local
