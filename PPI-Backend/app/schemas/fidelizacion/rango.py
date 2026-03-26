from pydantic import BaseModel, ConfigDict
from decimal import Decimal


class RangoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    puntos_min: int
    puntos_max: int
    porcentaje_descuento: Decimal


