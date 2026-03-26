import pytest
import httpx
from typing import Dict, Any

# Esta es la URL correcta para el endpoint de CREACIÓN
BASE_URL = "http://localhost:8000/local"

# Pega el token que obtuviste
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2IiwiZW1haWwiOiJqb3NlcGhfNTM5XzExQGhvdG1haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzYzMjQwNjAzLCJzZXNzaW9uX3ZlcnNpb24iOjEsImp0aSI6IjZhM2NkNzZhLWU1MzEtNDk2NC04MjMzLWE4ZjZjYTUzNDMzZSIsImZlY2hhX2NyZWFjaW9uIjoiMjAyNS0xMC0xMFQwMzozMDowNiIsImFkbWluX3R5cGUiOiJTdXBlciBBZG1pbmlzdHJhZG9yIn0.qqAQ7SosR3fcWgQX7V-X1gx7WUejVWeMQTzI7KND87c"
HEADERS = {"Authorization": f"Bearer {ADMIN_TOKEN}"}


def get_data_valida() -> Dict[str, Any]:
    """Retorna un payload base válido para un local."""
    return {
        "nombre": "Mi Local de Prueba",
        "direccion": "Av. Siempre Viva 123",
        "distrito_id": 12, # ID de un distrito válido (ej. San Miguel)
        "tipo_local_id": 1,     # ID de un tipo válido
        "aforo": 150
    }

@pytest.mark.asyncio
async def test_crear_local_exitoso():
    """Prueba el caso de éxito (1.1.1 del PDF) para tener una línea base."""
    data = get_data_valida()
    data["nombre"] = "Local Exitoso" # Nombre único

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/crear/", json=data, headers=HEADERS)

    assert response.status_code == 201 # 201 Creado
    response_data = response.json()
    assert response_data["nombre"] == data["nombre"]
    assert response_data["aforo"] == data["aforo"]
    assert response_data["activo"] is True # Verifica estado por defecto

@pytest.mark.asyncio
async def test_crear_local_error_nombre_obligatorio():
    """Prueba el caso de error: Nombre de local obligatorio (1.1.2.2)."""
    data = get_data_valida()
    data["nombre"] = ""  # Campo vacío

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/crear/", json=data, headers=HEADERS)

    # 422: Unprocessable Entity (Error de validación de Pydantic)
    assert response.status_code == 422 
    
    # Verifica que el error es específicamente sobre el campo 'nombre'
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "nombre"]
    assert "no puede estar vacío" in error_detail["msg"].lower() # O el mensaje de Pydantic

@pytest.mark.asyncio
async def test_crear_local_error_aforo_no_numerico():
    """Prueba el caso de error: Aforo no numérico (1.1.2.3)."""
    data = get_data_valida()
    data["aforo"] = "cien" # Valor no numérico

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/crear/", json=data, headers=HEADERS)

    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "aforo"]
    assert "integer" in error_detail["type"] # Pydantic espera un entero

@pytest.mark.asyncio
async def test_crear_local_error_aforo_negativo():
    """Prueba el caso de error: Aforo negativo (1.1.2.3)."""
    data = get_data_valida()
    data["aforo"] = -50 # Valor negativo (requiere validación > 0 en Pydantic)

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/crear/", json=data, headers=HEADERS)

    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "aforo"]
    assert "mayor que 0" in error_detail["msg"].lower() # Asumiendo que tienes un validador

@pytest.mark.asyncio
async def test_crear_local_error_nombre_limite_caracteres():
    """Prueba el caso de error: Límite de caracteres en nombre (1.1.2.1)."""
    data = get_data_valida()
    data["nombre"] = "a" * 300 

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/crear/", json=data, headers=HEADERS)

    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "nombre"]
    assert "límite de 255" in error_detail["msg"].lower() # Asumiendo límite de 255

@pytest.mark.asyncio
async def test_crear_local_error_distrito_obligatorio():
    """Prueba el caso de error: No seleccionar distrito (1.1.2.4)."""
    data = get_data_valida()
    data.pop("distrito_id") # Simula no enviar el campo

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/crear/", json=data, headers=HEADERS)

    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["loc"] == ["body", "distrito_id"]
    assert error_detail["type"] == "missing"