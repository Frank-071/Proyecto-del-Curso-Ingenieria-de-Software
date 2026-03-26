# app/routers/eventos/transferencia.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.eventos import (
    TransferPreviewRequest,
    TransferPreviewResponse,
    TransferConfirmResponse,
)
from app.services.eventos import TransferenciaService
from app.core.auth.dependencies import get_current_cliente_id

router = APIRouter(prefix="/entradas/transfer", tags=["transferencias"])


def get_transferencia_service(db: AsyncSession = Depends(get_db)) -> TransferenciaService:
    return TransferenciaService(db)


@router.post("/preview", response_model=TransferPreviewResponse)
async def preview(
    req: TransferPreviewRequest,
    emisor_cliente_id: int = Depends(get_current_cliente_id),
    service: TransferenciaService = Depends(get_transferencia_service),
):
    req.emisor_cliente_id = emisor_cliente_id
    return await service.preview_transfer(req)


@router.post("/confirm", response_model=TransferConfirmResponse)
async def confirm(
    req: TransferPreviewRequest,
    emisor_cliente_id: int = Depends(get_current_cliente_id),
    service: TransferenciaService = Depends(get_transferencia_service),
):
    req.emisor_cliente_id = emisor_cliente_id
    return await service.confirm_transfer(req)
