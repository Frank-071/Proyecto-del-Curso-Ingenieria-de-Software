import pytest
import httpx
from typing import Dict, Any
from datetime import datetime, timedelta

# 1. BASE_URL corregida (plural, sin /api/v1)
BASE_URL = "http://localhost:8000/eventos/"

# Copia el mismo token de admin que usaste para locales
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2IiwiZW1haWwiOiJqb3NlcGhfNTM5XzExQGhvdG1haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzYzMjQwNjAzLCJzZXNzaW9uX3ZlcnNpb24iOjEsImp0aSI6IjZhM2NkNzZhLWU1MzEtNDk2NC04MjMzLWE4ZjZjYTUzNDMzZSIsImZlY2hhX2NyZWFjaW9uIjoiMjAyNS0xMC0xMFQwMzozMDowNiIsImFkbWluX3R5cGUiOiJTdXBlciBBZG1pbmlzdHJhZG9yIn0.qqAQ7SosR3fcWgQX7V-X1gx7WUejVWeMQTzI7KND87c" # Reemplaza si expiró
HEADERS = {"Authorization": f"Bearer {ADMIN_TOKEN}"}


def get_data_valida() -> Dict[str, Any]:
    """Retorna un payload base válido para un evento."""
    
    start_time = datetime.now() + timedelta(days=10)
    end_time = start_time + timedelta(hours=3)
    
    return {
        "nombre": "Evento de Prueba",
        "descripcion": "Descripción del evento de prueba.",
        "fecha_hora_inicio": start_time.isoformat(),
        "fecha_hora_fin": end_time.isoformat(),
        
        "local_id": "1", 
        "categoria_evento_id": "1", 
        "organizador_id": "1", 
        
        "es_nominal": "false", 
        "estado": "Borrador",
        
        # --- AÑADE ESTA LÍNEA ---
        "administrador_id": "6" # ID del admin que está creando (el dueño del token)
    }

@pytest.mark.asyncio
async def test_crear_evento_exitoso():
    """Prueba el caso de éxito (2.1.1)"""
    data = get_data_valida()
    data["nombre"] = f"Evento Test {datetime.now().timestamp()}" 

    async with httpx.AsyncClient() as client:
        # 2. La ruta es solo BASE_URL (sin /crear/)
        # 3. Se usa `data=` (para form-data) en lugar de `json=`
        response = await client.post(BASE_URL, data=data, headers=HEADERS) 

    assert response.status_code == 200
    response_data = response.json()["data"]
    assert response_data["nombre"] == data["nombre"]

# --- Pruebas de Error / Validaciones (2.1.2) ---

@pytest.mark.asyncio
async def test_crear_evento_error_nombre_obligatorio():
    """Validación: No se ingresa el nombre del evento"""
    data = get_data_valida()
    data["nombre"] = "" 
    async with httpx.AsyncClient() as client:
        response = await client.post(BASE_URL, data=data, headers=HEADERS)
        
    assert response.status_code == 404
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "nombre"]

@pytest.mark.asyncio
async def test_crear_evento_error_descripcion_obligatoria():
    """Validación: No se ingresa la descripción del evento"""
    data = get_data_valida()
    data["descripcion"] = "" 
    async with httpx.AsyncClient() as client:
        response = await client.post(BASE_URL, data=data, headers=HEADERS)
        
    assert response.status_code == 404
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "descripcion"]

@pytest.mark.asyncio
async def test_crear_evento_error_categoria_obligatoria():
    """Validación: No se selecciona el tipo de evento (categoría)"""
    data = get_data_valida()
    data.pop("categoria_evento_id")
    async with httpx.AsyncClient() as client:
        response = await client.post(BASE_URL, data=data, headers=HEADERS)
        
    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "categoria_evento_id"]
    assert error_detail["type"] == "missing"

@pytest.mark.asyncio
async def test_crear_evento_error_organizador_obligatorio():
    """Validación: No se selecciona el organizador del evento"""
    data = get_data_valida()
    data.pop("organizador_id")
    async with httpx.AsyncClient() as client:
        response = await client.post(BASE_URL, data=data, headers=HEADERS)
        
    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "organizador_id"]
    assert error_detail["type"] == "missing"

@pytest.mark.asyncio
async def test_crear_evento_error_local_obligatorio():
    """Validación: No se selecciona el local"""
    data = get_data_valida()
    data.pop("local_id")
    async with httpx.AsyncClient() as client:
        response = await client.post(BASE_URL, data=data, headers=HEADERS)
        
    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "local_id"]
    assert error_detail["type"] == "missing"

@pytest.mark.asyncio
async def test_crear_evento_error_fecha_pasada():
    """Validación: Se selecciona fecha anterior a la actual"""
    data = get_data_valida()
    data["fecha_hora_inicio"] = (datetime.now() - timedelta(days=1)).isoformat()
    data["fecha_hora_fin"] = (datetime.now() + timedelta(hours=1)).isoformat()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(BASE_URL, data=data, headers=HEADERS)
    
    assert response.status_code == 200
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "fecha_hora_inicio"]