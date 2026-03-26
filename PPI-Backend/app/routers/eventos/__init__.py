# app/routers/eventos/__init__.py
from .evento import router as evento_router
from .zona import router as zona_router
from .entrada import router as entrada_router
from .transferencia import router as transferencia_router
from .categoria_evento import router as categoria_evento_router
from .historial_transferencia import router as historial_transferencia_router

__all__ = [
    "evento_router",
    "zona_router",
    "entrada_router",
    "transferencia_router",
    "categoria_evento_router",
    "historial_transferencia_router",
]
