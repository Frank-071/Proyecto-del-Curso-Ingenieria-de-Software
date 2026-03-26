from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class NotificacionCreate(BaseModel):
    entrada_id: int
    cliente_id: int
    zona_id: Optional[int] = None
    evento_id: Optional[int] = None
    notify_at: Optional[datetime] = None


class NotificacionRead(BaseModel):
    id: int
    entrada_id: int
    cliente_id: int
    zona_id: Optional[int]
    evento_id: Optional[int]
    notify_at: Optional[datetime]
    notify_end: Optional[datetime]
    status: int
    attempts: int
    last_error: Optional[str]
    processed_at: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
