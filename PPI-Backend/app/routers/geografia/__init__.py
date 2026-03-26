from .departamento import router as departamento_router
from .provincia import router as provincia_router
from .distrito import router as distrito_router

__all__ = ["departamento_router", "provincia_router", "distrito_router"]
