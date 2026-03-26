from .organizadores import OrganizadorService
from .locales import LocalService, TipoLocalService
from .geografia import DepartamentoService, ProvinciaService, DistritoService
from .pagos import PagoService
from .promociones import PromocionService

__all__ = [
	"OrganizadorService",
	"LocalService",
	"TipoLocalService",
	"DepartamentoService",
	"ProvinciaService",
	"DistritoService",
	"PagoService",
	"PromocionService"
]