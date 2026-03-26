from .base_repository import BaseRepository
from .organizadores import OrganizadorRepository
from .fidelizacion import RangoRepository
from .locales import LocalRepository, TipoLocalRepository
from .geografia import DepartamentoRepository, ProvinciaRepository, DistritoRepository
from .pagos import PagoRepository, DetallePagoRepository

__all__ = [
    "BaseRepository",
    "LocalRepository",
    "TipoLocalRepository",
    "DistritoRepository",
    "DepartamentoRepository",
    "ProvinciaRepository",
    "OrganizadorRepository",
    "RangoRepository",
    "PagoRepository",
    "DetallePagoRepository",
    "PromocionRepository",
]