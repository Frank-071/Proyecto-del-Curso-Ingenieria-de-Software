from fastapi import APIRouter, Depends, Path, Query, Body, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.database.connection import get_db, AsyncSessionLocal
from app.schemas.eventos import EntradaRequest
from app.schemas.eventos.entrada import EntradaBulkMultiRequest, EntradaLimiteResponse
from app.services.eventos import EntradaService
from app.core.auth.dependencies import get_current_cliente_id, get_current_user

router = APIRouter(
    prefix="/entradas",
    tags=["entradas"]
)


def get_entrada_service(db: AsyncSession = Depends(get_db)) -> EntradaService:
    return EntradaService(db)


@router.get("/cliente/{cliente_id}")
async def get_entradas_cliente_endpoint(
    cliente_id: int = Path(gt=0, description="ID del cliente debe ser mayor a 0"),
    entrada_service: EntradaService = Depends(get_entrada_service)
) -> Dict:
    return await entrada_service.get_entradas_cliente(cliente_id)


@router.post("/bulk-multi")
async def create_entradas_bulk_multi_endpoint(
    entrada_service: EntradaService = Depends(get_entrada_service),
    current_user = Depends(get_current_user),
    payload: EntradaBulkMultiRequest = Body(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> Dict:
    """
    Crea todas las entradas de un checkout en una sola petición optimizada.
    Recibe un payload con 'items' (zona_id/cantidad) y totales.
    
    El envío de correo con las entradas se ejecuta en background para respuesta inmediata.
    """
    # Obtener cliente_id del usuario autenticado
    cliente_id = current_user.cliente.id if hasattr(current_user, 'cliente') and current_user.cliente else current_user.id
    
    result = await entrada_service.create_entradas_bulk_multi(payload, cliente_id)
    
    data = result.get('data', {}) if isinstance(result, dict) else {}
    entries = data.get('entries') or []
    entradas_data = data.get('entries_email') or entries
    entrada_ids = [entrada.get('id') for entrada in entries if isinstance(entrada, dict) and entrada.get('id')]
    email = getattr(current_user, 'email', None)

    # Encolar tareas en background: correo y generación de PDFs
    if entradas_data and email:
            async def enviar_correo_background():
                async with AsyncSessionLocal() as session:
                    service = EntradaService(session)
                    await service.enviar_correo_entradas(cliente_id, email, entradas_data)
            
            background_tasks.add_task(enviar_correo_background)
        
    if entrada_ids:
        async def generar_pdfs_background():
            async with AsyncSessionLocal() as session:
                service = EntradaService(session)
                await service.generate_and_upload_pdfs_background(entrada_ids)
        
        background_tasks.add_task(generar_pdfs_background)
    
    # Retornar inmediatamente - las tareas en background se ejecutarán después
    return result


@router.post("/enviar-correo")
async def enviar_correo_entradas_endpoint(
    datos: dict,
    entrada_service: EntradaService = Depends(get_entrada_service),
    current_user = Depends(get_current_user)
) -> Dict:
    """
    Recibe la lista de entradas generadas y envía un correo al cliente.
    """
    return await entrada_service.enviar_correo_entradas(
        cliente_id=current_user.id,
        email=current_user.email,
        entradas=datos.get("entradas", [])
    )


@router.get("/evento/{evento_id}/limite")
async def get_limite_entradas_evento_endpoint(
    evento_id: int = Path(gt=0, description="ID del evento"),
    entrada_service: EntradaService = Depends(get_entrada_service),
    current_user = Depends(get_current_user)
) -> Dict:
    cliente_id = current_user.cliente.id if hasattr(current_user, 'cliente') and current_user.cliente else current_user.id
    return await entrada_service.get_limite_entradas_evento(cliente_id, evento_id)


@router.get("/{entrada_id}/qr-pdf")
async def get_entrada_qr_pdf_endpoint(
    entrada_id: int = Path(gt=0, description="ID de la entrada"),
    entrada_service: EntradaService = Depends(get_entrada_service),
    current_user = Depends(get_current_user)
) -> Dict:
    cliente_id = current_user.cliente.id if hasattr(current_user, 'cliente') and current_user.cliente else current_user.id
    return await entrada_service.get_entrada_qr_pdf_url(entrada_id, cliente_id)


# @router.get("/test/generate-pdf/{entrada_id}")
# async def test_generate_pdf_endpoint(
#     entrada_id: int = Path(gt=0, description="ID de la entrada a generar PDF"),
#     entrada_service: EntradaService = Depends(get_entrada_service)
# ) -> Dict:
#     from app.utils.pdf.entrada_pdf import generate_entrada_pdf
#     from app.services.shared import S3Service
#     from app.models import Evento, Local
#     from sqlalchemy import select
#     from sqlalchemy.orm import selectinload
#     from app.models import Entrada, Zona, Cliente
    
#     stmt = (
#         select(Entrada)
#         .options(
#             selectinload(Entrada.zona).selectinload(Zona.evento).selectinload(Evento.local),
#             selectinload(Entrada.cliente).selectinload(Cliente.usuario)
#         )
#         .where(Entrada.id == entrada_id)
#     )
#     result = await entrada_service.db.execute(stmt)
#     entrada = result.scalar_one_or_none()
    
#     if not entrada:
#         return {
#             "success": False,
#             "message": f"Entrada {entrada_id} no encontrada"
#         }
    
#     if not entrada.zona or not entrada.zona.evento:
#         return {
#             "success": False,
#             "message": "La entrada no tiene zona o evento asociado"
#         }
    
#     evento = entrada.zona.evento
#     local_nombre = evento.local.nombre if evento.local else "Local no disponible"
#     cliente_nombres = entrada.cliente.usuario.nombres if entrada.cliente and entrada.cliente.usuario else None
#     cliente_apellidos = entrada.cliente.usuario.apellidos if entrada.cliente and entrada.cliente.usuario else None
    
#     pdf_bytes = generate_entrada_pdf(
#         entrada_id=entrada.id,
#         codigo_qr=entrada.codigo_qr or f"ENT-{entrada.id}",
#         evento_nombre=evento.nombre,
#         evento_fecha=evento.fecha_hora_inicio,
#         evento_icono_url=evento.icono,
#         local_nombre=local_nombre,
#         zona_nombre=entrada.zona.nombre,
#         zona_precio=float(entrada.zona.precio),
#         cliente_nombres=cliente_nombres,
#         cliente_apellidos=cliente_apellidos,
#         nominado_nombres=entrada.nombres_nominado,
#         nominado_apellidos=entrada.apellidos_nominado
#     )
    
#     s3_service = S3Service()
#     await s3_service.upload_entrada_pdf(pdf_bytes, entrada.id)
#     s3_key = f"entradas/entrada_{entrada.id}.pdf"
#     presigned_url = await s3_service.get_presigned_url_download(s3_key, expiration=3600)
    
#     return {
#         "success": True,
#         "pdf_url": presigned_url,
#         "entrada_id": entrada.id,
#         "codigo_qr": entrada.codigo_qr,
#         "message": "PDF generado exitosamente"
#     }
