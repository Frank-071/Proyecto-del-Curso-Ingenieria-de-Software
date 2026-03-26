from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
from app.utils.sanitizer import sanitize_text

class OrganizadorBase(BaseModel):
    nombre: Optional[str] = Field(None, max_length=50)
    correo: Optional[EmailStr] = None
    telefono: str = Field(..., max_length=23)
    
    @field_validator('nombre')
    @classmethod
    def sanitize_nombre(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(v, max_length=50)

class OrganizadorCreate(OrganizadorBase):
    pass

class OrganizadorUpdate(OrganizadorBase):
    pass

class OrganizadorResponse(OrganizadorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

