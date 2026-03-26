from pydantic import BaseModel, ConfigDict


class DepartamentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nombre: str
    ubigeo: str

