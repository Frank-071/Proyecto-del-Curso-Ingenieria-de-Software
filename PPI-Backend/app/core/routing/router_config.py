from fastapi import APIRouter
from app.routers.auth import register, validate, login, cliente, password_reset
from app.routers.users.cliente import router as cliente_profile_router
from app.routers.organizadores import organizador_router
from app.routers.locales import local_router, tipo_local_router
from app.routers.geografia import departamento_router, provincia_router, distrito_router
from app.routers.eventos import evento_router, zona_router, entrada_router, transferencia_router, categoria_evento_router, historial_transferencia_router
from app.routers.promociones import promocion_router
from app.routers.locales.importar_locales import router as importar_locales_router
from app.routers.auditoria import router as auditoria_router
from app.routers.users.admin import router as admin_router
from app.routers.users.usuario_router import router as usuario_router


def get_all_routers() -> list[APIRouter]:
    return [
        # Routers de ubicaciones
        local_router,
        tipo_local_router,
        distrito_router,
        provincia_router,
        departamento_router,
        usuario_router,

        #importar locales
        importar_locales_router,
        
        # Routers de catálogos
        categoria_evento_router,
        
        # Routers de organizadores
        organizador_router,
        
        # Routers de autenticación
        register.router,
        validate.router,
        login.router,
        password_reset.router,
        
        # Routers de clientes
        cliente.router,
        cliente_profile_router,
        
        # Routers de eventos
        evento_router,
        zona_router,
        entrada_router,
        transferencia_router,
        promocion_router,
        historial_transferencia_router,

        # ⬇️ NUEVO: router de Admin (perfil + stats dashboard)
        admin_router,
        
        # Router de auditoría y reportería
        auditoria_router,
    ]