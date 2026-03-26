# app/routers/auth/cliente.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.schemas.auth.usuario import ProfileUpdate, PasswordChangeRequest
from app.services.auth.usuario_service import UsuarioService
from app.database.connection import get_db
from app.repositories.eventos.transferencia_repository import find_cliente_by_dni
from app.core.auth.dependencies import get_current_cliente_id
from app.core.exceptions import AuthorizationError
from app.core.rate_limiting import SimpleRateLimiter

router = APIRouter(prefix="/clientes", tags=["clientes"])

# Rate limiting para cambio de contraseña
change_password_limiter = SimpleRateLimiter(
    max_requests=5,
    window_seconds=3600,  # 1 hora
    key_prefix="rate_limit:change_password:user"
)

# Modelo de respuesta para búsqueda por DNI (lo usa el modal de transferencia)
class ClienteLookupResponse(BaseModel):
    cliente_id: int
    dni: str

@router.post("/{cliente_id}/foto-perfil")
async def upload_profile_photo(
    cliente_id: str, 
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_cliente_id: int = Depends(get_current_cliente_id)
):
    if int(cliente_id) != current_cliente_id:
        raise AuthorizationError("No puedes modificar la foto de otro usuario")
    
    usuario_service = UsuarioService(db)
    return await usuario_service.upload_profile_photo(cliente_id, file)

@router.get("/{cliente_id}/foto-perfil")
async def get_profile_photo(
    cliente_id: str,
    db: AsyncSession = Depends(get_db),
    current_cliente_id: int = Depends(get_current_cliente_id)
):
    if int(cliente_id) != current_cliente_id:
        raise AuthorizationError("No puedes ver la foto de otro usuario")
    
    usuario_service = UsuarioService(db)
    return await usuario_service.get_profile_photo(cliente_id)

@router.delete("/{cliente_id}/foto-perfil")
async def delete_profile_photo(
    cliente_id: str,
    db: AsyncSession = Depends(get_db),
    current_cliente_id: int = Depends(get_current_cliente_id)
):
    if int(cliente_id) != current_cliente_id:
        raise AuthorizationError("No puedes eliminar la foto de otro usuario")
    
    usuario_service = UsuarioService(db)
    return await usuario_service.delete_profile_photo(cliente_id)

@router.get("/{cliente_id}/perfil")
async def get_profile(
    cliente_id: str,
    db: AsyncSession = Depends(get_db),
    current_cliente_id: int = Depends(get_current_cliente_id)
):
    if int(cliente_id) != current_cliente_id:
        raise AuthorizationError("No puedes ver el perfil de otro usuario")
    
    usuario_service = UsuarioService(db)
    return await usuario_service.get_profile(cliente_id)

@router.put("/{cliente_id}/perfil")
async def update_profile(
    cliente_id: str,
    profile_data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_cliente_id: int = Depends(get_current_cliente_id)
):
    if int(cliente_id) != current_cliente_id:
        raise AuthorizationError("No puedes modificar el perfil de otro usuario")
    
    usuario_service = UsuarioService(db)
    return await usuario_service.update_profile(cliente_id, profile_data)

@router.put("/{cliente_id}/password")
async def change_password(
    cliente_id: str,
    password_data: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_cliente_id: int = Depends(get_current_cliente_id)
):
    try:
        cliente_id_int = int(cliente_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID de cliente inválido")
    
    if cliente_id_int != current_cliente_id:
        raise AuthorizationError("No puedes cambiar la contraseña de otro usuario")
    
    # Rate limiting por usuario
    await change_password_limiter.check_rate_limit(
        str(current_cliente_id),
        custom_error_message="Demasiados intentos de cambio de contraseña. Espera 1 hora."
    )
    
    usuario_service = UsuarioService(db)
    return await usuario_service.change_password(cliente_id_int, password_data)

# --- NUEVO: búsqueda de cliente por DNI para el modal de transferencia ---
@router.get("/buscar", response_model=ClienteLookupResponse)
async def buscar_cliente_por_dni(
    dni: str = Query(..., min_length=6, max_length=12),
    db: AsyncSession = Depends(get_db),
):
    # Por qué: resolver destinatario por DNI antes de preview/confirm.
    cliente_id = await find_cliente_by_dni(db, dni)
    if cliente_id is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado por DNI.")
    return ClienteLookupResponse(cliente_id=cliente_id, dni=dni)
