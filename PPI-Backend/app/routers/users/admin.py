from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.auth.dependencies import get_current_admin_user
from app.database.connection import get_db
from app.utils.handlers.response_handler import ResponseHandler
from app.schemas.auth.usuario import UsuarioResponse

from app.models.locales import Local
from app.models.eventos import Evento
from app.models.auth.usuario import Usuario

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/perfil")
async def obtener_perfil_admin(
    current_admin = Depends(get_current_admin_user),
):
    user_data = UsuarioResponse.model_validate(current_admin)
    return ResponseHandler.success_response(
        user_data.model_dump(),
        "Perfil de administrador obtenido exitosamente",
    )


@router.get("/dashboard/stats")
async def obtener_stats_dashboard(
    current_admin = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_locales = (
        await db.execute(select(func.count()).select_from(Local))
    ).scalar_one() or 0

    total_eventos = (
        await db.execute(select(func.count()).select_from(Evento))
    ).scalar_one() or 0

    total_usuarios = (
        await db.execute(select(func.count()).select_from(Usuario))
    ).scalar_one() or 0

    eventos_activos = (
        await db.execute(
            select(func.count()).select_from(Evento).where(
                getattr(Evento, "estado", None) == "Publicado"
            )
        )
    ).scalar_one() or 0

    admin_name = current_admin.nombres or "Usuario"
    fecha_creacion = current_admin.fecha_creacion

    data = {
        "totalLocales": total_locales,
        "totalEventos": total_eventos,
        "totalUsuarios": total_usuarios,
        "eventosActivos": eventos_activos,
        "adminName": admin_name,
        "fechaCreacion": fecha_creacion.isoformat() if fecha_creacion else None,
    }

    return ResponseHandler.success_response(
        data,
        "Estadísticas del dashboard obtenidas exitosamente",
    )



