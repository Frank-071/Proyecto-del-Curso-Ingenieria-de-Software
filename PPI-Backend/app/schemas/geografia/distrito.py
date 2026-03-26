from pydantic import BaseModel, ConfigDict


class DistritoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    provincia_id: int
    nombre: str

