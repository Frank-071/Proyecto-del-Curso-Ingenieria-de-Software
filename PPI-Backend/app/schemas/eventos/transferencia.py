# app/schemas/eventos/transferencia.py
from typing import List, Optional
from pydantic import BaseModel, Field, conlist

class TransferPreviewRequest(BaseModel):
    # Emisor viene del JWT; este campo queda opcional.
    emisor_cliente_id: Optional[int] = None
    destinatario_dni: str = Field(..., min_length=6, max_length=12)
    # Pydantic v2: usa min_length (no min_items)
    entrada_ids: conlist(int, min_length=1)
    mensaje: Optional[str] = None

class GrupoResumen(BaseModel):
    evento_id: int
    evento_nombre: Optional[str] = None
    zona_id: int
    zona_nombre: Optional[str] = None
    cantidad: int

class TransferPreviewResponse(BaseModel):
    destinatario_cliente_id: int
    total: int
    grupos: List[GrupoResumen]

class TransferConfirmResponse(BaseModel):
    transferidas: int
    transferencia_ids: List[int]
