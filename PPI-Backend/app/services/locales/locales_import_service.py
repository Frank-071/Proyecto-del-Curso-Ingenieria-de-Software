import pyexcel as pe
import io
from datetime import datetime
import logging
from typing import Dict, List
from app.repositories.locales.local_repository import LocalRepository
from app.services.locales.local_service import LocalService
from app.schemas.locales.local import LocalRequest

logger = logging.getLogger(__name__)

class LocalImportService:
    expected_columns = {
        "Distrito": str,
        "Distrito ID": int,
        "Tipo Local": str,
        "Tipo Local ID": int,
        "Nombre": str,
        "Dirección": str,
        "Aforo": int,
    }

    @staticmethod
    def _translate_value_error(error: Exception) -> str:
        message = str(error).strip()
        normalized = message.lower()

        if "invalid literal for int" in normalized or "value is not a valid integer" in normalized:
            return "valor inválido en una columna numérica. Usa solo números enteros sin espacios ni caracteres adicionales"

        if "could not convert string to float" in normalized or "invalid literal for float" in normalized or "value is not a valid float" in normalized:
            return "valor inválido en una columna decimal. Revisa que los números tengan el formato 0.00 y no contengan texto"

        if "field required" in normalized or "value_error.missing" in normalized:
            return "falta un valor obligatorio. Completa todas las columnas requeridas"

        return message

    @staticmethod
    async def validate_excel(file_bytes: bytes, file_type: str, tipo_local_service, db):  # tipo_local_service no se usa pero se mantiene por compatibilidad con el router
        logger.debug(f"Tamaño del archivo recibido → {len(file_bytes)} bytes")

        try:
            sheet = pe.get_sheet(
                file_content=io.BytesIO(file_bytes),
                file_type=file_type,
                name_columns_by_row=0
            )
            data = [r for r in sheet.to_records()]
        except Exception as e:
            raise ValueError(f"Error leyendo archivo: {e}")

        if not data:
            raise ValueError("El archivo está vacío o no se pudo leer correctamente.")

        headers = data[0].keys()
        missing_columns = [col for col in LocalImportService.expected_columns if col not in headers]
        if missing_columns:
            raise ValueError(f"Faltan columnas obligatorias: {missing_columns}")

        errores = []
        valid_rows = []
        insertados = []
        
        local_service = LocalService(db)
        local_repository = LocalRepository(db)

        # Primero: Validar todas las filas y preparar datos
        tipo_local_ids_set = set()
        distrito_ids_set = set()
        direcciones_list = []
        
        for row_idx, row in enumerate(data, start=2):
            row_errors = []

            # Validación de tipos
            for col, expected_type in LocalImportService.expected_columns.items():
                val = row.get(col)
                if val in (None, ""):
                    continue
                try:
                    if expected_type == int:
                        int(val)
                    elif expected_type == float:
                        float(val)
                    elif expected_type == str:
                        str(val)
                    elif expected_type == "datetime":
                        if not isinstance(val, datetime):
                            raise ValueError
                except ValueError:
                    row_errors.append(
                        f"Fila {row_idx}, columna '{col}' tiene tipo inválido (esperado: {expected_type.__name__})"
                    )

            if not row_errors:
                try:
                    tipo_local_id = int(row.get("Tipo Local ID"))
                    distrito_id = int(row.get("Distrito ID"))
                    tipo_local_ids_set.add(tipo_local_id)
                    distrito_ids_set.add(distrito_id)
                    
                    direccion = row.get("Dirección")
                    if direccion:
                        direcciones_list.append(direccion)
                    
                    local_data = LocalRequest(
                        nombre=row.get("Nombre"),
                        direccion=direccion,
                        aforo=int(row.get("Aforo")),
                        distrito_id=distrito_id,
                        tipo_local_id=tipo_local_id,
                    )
                    
                    valid_rows.append((row_idx, row, local_data))
                except (ValueError, TypeError) as e:
                    friendly = LocalImportService._translate_value_error(e)
                    row_errors.append(f"Fila {row_idx}: {friendly}")

            if row_errors:
                errores.extend(row_errors)

        # Segundo: Validaciones en batch (3 queries optimizadas)
        valid_tipo_local_ids = set()
        valid_distrito_ids = set()
        existing_direcciones = set()
        
        if tipo_local_ids_set:
            try:
                valid_tipo_local_ids = await local_repository.validate_tipos_local_ids(list(tipo_local_ids_set))
            except Exception as e:
                logger.error(f"Error al validar tipos_local_id: {e}")
        
        if distrito_ids_set:
            try:
                valid_distrito_ids = await local_repository.validate_distrito_ids(list(distrito_ids_set))
            except Exception as e:
                logger.error(f"Error al validar distrito_ids: {e}")
        
        if direcciones_list:
            try:
                existing_direcciones = await local_repository.get_existing_direcciones(list(set(direcciones_list)))
            except Exception as e:
                logger.error(f"Error al validar direcciones: {e}")

        # Tercero: Procesar filas válidas y detectar duplicados
        locales_to_insert = []
        direcciones_vistas = set()  # Para detectar duplicados en el archivo
        
        for row_idx, row, local_data in valid_rows:
            # Validar tipo_local_id
            if local_data.tipo_local_id not in valid_tipo_local_ids:
                errores.append(f"Fila {row_idx}: Tipo Local ID {local_data.tipo_local_id} no existe (local: '{local_data.nombre}')")
                continue
            
            # Validar distrito_id
            if local_data.distrito_id not in valid_distrito_ids:
                errores.append(f"Fila {row_idx}: Distrito ID {local_data.distrito_id} no existe (local: '{local_data.nombre}')")
                continue
            
            # Validar duplicados en BD
            if local_data.direccion in existing_direcciones:
                insertados.append({
                    "fila": row_idx,
                    "nombre": local_data.nombre,
                    "mensaje": f"Fila {row_idx}: ya existía en la base de datos (omitido)"
                })
                continue
            
            # Validar duplicados en archivo
            if local_data.direccion in direcciones_vistas:
                errores.append(f"Fila {row_idx}: dirección duplicada en el archivo: '{local_data.direccion}'")
                continue
            
            direcciones_vistas.add(local_data.direccion)
            locales_to_insert.append((row_idx, local_data))

        # Cuarto: Bulk insert de todas las filas válidas
        if locales_to_insert:
            try:
                locales_data = [local_data for _, local_data in locales_to_insert]
                locales_creados = await local_service.create_locales_bulk(
                    locales_data, 
                    skip_geocoding=True, 
                    skip_validation=True
                )
                
                for (row_idx, local_data) in locales_to_insert[:len(locales_creados)]:
                    insertados.append({
                        "fila": row_idx,
                        "nombre": local_data.nombre,
                        "mensaje": f"Fila {row_idx}: insertado correctamente"
                    })
                        
            except Exception as e:
                error_text = str(e)
                logger.error(f"Error en bulk insert: {error_text}")
                if "duplicate" in error_text.lower() or "unique constraint" in error_text.lower():
                    errores.append(f"Error al insertar: se encontraron direcciones duplicadas")
                else:
                    errores.append(f"Error al insertar locales: {error_text}")

        return {
            "columns": list(headers),
            "total_rows": len(data),
            "valid_rows": [row for _, row, _ in valid_rows],
            "insertados": insertados,
            "errores": errores
        }



    @staticmethod
    def detect_file_type(contents: bytes) -> str:
        """Detecta tipo de archivo a partir de los bytes"""
        # XLSX es un ZIP -> empieza con PK
        if contents.startswith(b'PK'):
            return "xlsx"
        # XLS empieza con D0 CF (OLE Compound)
        if contents[:2] == b'\xD0\xCF':
            return "xls"
        # Si contiene comas o punto y coma al inicio, asumimos CSV
        if b"," in contents.splitlines()[0] or b";" in contents.splitlines()[0]:
            return "csv"
        # Por defecto
        return "xlsx"

    @staticmethod
    def extract_records(file_bytes: bytes, file_type: str) -> List[Dict]:
        """Extrae filas del Excel como lista de diccionarios"""
        sheet = pe.get_sheet(
            file_content=io.BytesIO(file_bytes),
            file_type=file_type,
            name_columns_by_row=0
        )
        return [r for r in sheet.to_records()]