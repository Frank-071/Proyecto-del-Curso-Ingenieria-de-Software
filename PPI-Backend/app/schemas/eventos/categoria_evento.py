from pydantic import BaseModel, ConfigDict


class CategoriaEventoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nombre: str
    descripcion: str

