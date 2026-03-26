from pydantic import BaseModel, ConfigDict


class ProvinciaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    departamento_id: int
    nombre: str
    ubigeo: str

