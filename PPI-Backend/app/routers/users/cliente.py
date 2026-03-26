from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.services.auth import ClienteService
from app.schemas.auth.usuario import UsuarioResponse
from app.utils.handlers.response_handler import ResponseHandler

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/perfil")
async def obtener_perfil(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cliente_service = ClienteService(db)
    return await cliente_service.get_perfil_completo(current_user, current_user.id)


@router.get("/perfil/cuenta")
async def obtener_perfil_cuenta(current_user = Depends(get_current_user)):
    user_data = UsuarioResponse.model_validate(current_user)
    return ResponseHandler.success_response(user_data, "Perfil de cuenta obtenido exitosamente")