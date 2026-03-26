from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.locales.locales_import_service import LocalImportService
from app.services.locales.local_service import LocalService
from app.services.locales.tipo_local_service import TipoLocalService
from app.core.auth import get_current_admin_user
from app.database.connection import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
from app.schemas.locales.local import LocalRequest
import logging

router = APIRouter(prefix="/locales/import", tags=["Locales Import"])
logger = logging.getLogger(__name__)

def get_local_service(db: AsyncSession = Depends(get_db)) -> LocalService:
    return LocalService(db)

def get_tipo_local_service(db: AsyncSession = Depends(get_db)) -> TipoLocalService:
    return TipoLocalService(db)

# 🔹 Endpoint de validación (no guarda en BD)
@router.post("/")
async def importar_locales(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tipo_local_service: TipoLocalService = Depends(get_tipo_local_service)
):
    # Validar extensión
    if not file.filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(status_code=400, detail="Formato de archivo no válido")

    # Leer contenido del archivo
    file_bytes = await file.read()
    logger.debug(f"Tamaño del archivo recibido → {len(file_bytes)} bytes")

    # Detectar tipo de archivo
    if file.filename.endswith(".xlsx"):
        file_type = "xlsx"
    elif file.filename.endswith(".xls"):
        file_type = "xls"
    else:
        file_type = "csv"
    logger.debug(f"Tipo detectado → {file_type}")

    try:
        resultado = await LocalImportService.validate_excel(file_bytes, file_type, tipo_local_service, db)
        return {"message": "Archivo válido", "data": resultado}
    except Exception as e:
        logger.exception("Error al procesar el archivo")
        raise HTTPException(status_code=400, detail=str(e))


# 🔹 Endpoint que guarda los locales validados en BD
@router.post("/save")
async def importar_locales_save(
    file: UploadFile = File(...),
    current_user = Depends(get_current_admin_user),
    local_service: LocalService = Depends(get_local_service)
) -> Dict:
    """Importa los locales desde Excel y los crea en la base de datos"""
    file_bytes = await file.read()
    try:
        file_type = LocalImportService.detect_file_type(file_bytes)
        data = LocalImportService.extract_records(file_bytes, file_type)

        creados, errores = 0, []

        for idx, row in enumerate(data, start=2):  # fila 2 = primera data
            try:
                local_data = LocalRequest(**row)
                await local_service.create_local(local_data)
                creados += 1
            except Exception as e:
                errores.append(f"Fila {idx}: {str(e)}")

        return {
            "creados": creados,
            "errores": errores,
            "total": len(data),
            "success": len(errores) == 0
        }

    except ValueError as e:
        logger.exception("Error al procesar el archivo")
        raise HTTPException(status_code=400, detail=str(e))
