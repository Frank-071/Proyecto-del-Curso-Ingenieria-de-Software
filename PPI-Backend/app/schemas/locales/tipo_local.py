from pydantic import BaseModel, ConfigDict
from typing import Optional


class TipoLocalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nombre: str
    descripcion: Optional[str] = None

