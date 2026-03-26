"""
Fixtures específicas para tests de autenticación.

Este archivo contiene fixtures y datos de prueba para el módulo auth.
"""

import pytest
from datetime import datetime
from app.models import Usuario, Cliente, Administrador


@pytest.fixture
def mock_usuario_cliente():
    """
    Usuario válido con rol de cliente para tests.
    
    Returns:
        Usuario con datos completos y cliente asociado.
    """
    usuario = Usuario(
        id=1,
        tipo_documento_id=1,
        nombres="Juan",
        apellidos="Pérez",
        numero_documento="12345678",
        genero="Masculino",
        email="juan.perez@example.com",
        contrasena="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJPU/6bO",  # Hash de "password123"
        telefono="987654321",
        fecha_creacion=datetime.now(),
        activo=True
    )
    
    # Crear cliente asociado
    cliente = Cliente(
        id=1,
        rango_id=1,
        puntos_disponibles=100,
        puntos_historicos=500,
        recibir_notificaciones=True
    )
    
    # Relaciones
    usuario.cliente = cliente
    cliente.usuario = usuario
    
    return usuario


@pytest.fixture
def mock_usuario_admin():
    """
    Usuario válido con rol de administrador para tests.
    
    Returns:
        Usuario con datos completos y administrador asociado.
    """
    usuario = Usuario(
        id=2,
        tipo_documento_id=1,
        nombres="María",
        apellidos="García",
        numero_documento="87654321",
        genero="Femenino",
        email="maria.garcia@admin.com",
        contrasena="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJPU/6bO",  # Hash de "password123"
        telefono="987123456",
        fecha_creacion=datetime.now(),
        activo=True
    )
    
    # Crear administrador asociado
    admin = Administrador(
        id=2,
        nivel_acceso="superadmin"
    )
    
    # Relaciones
    usuario.administrador = admin
    admin.usuario = usuario
    
    return usuario


@pytest.fixture
def mock_usuario_inactivo():
    """
    Usuario inactivo para tests de validación.
    
    Returns:
        Usuario desactivado con cliente asociado.
    """
    usuario = Usuario(
        id=3,
        tipo_documento_id=1,
        nombres="Pedro",
        apellidos="López",
        numero_documento="11111111",
        genero="Masculino",
        email="pedro.lopez@example.com",
        contrasena="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJPU/6bO",
        telefono="999888777",
        fecha_creacion=datetime.now(),
        activo=False  # Usuario inactivo
    )
    
    # Crear cliente asociado (aunque esté inactivo, puede tener cliente)
    cliente = Cliente(
        id=3,
        rango_id=1,
        puntos_disponibles=0,
        puntos_historicos=0,
        recibir_notificaciones=False
    )
    
    # Relaciones
    usuario.cliente = cliente
    cliente.usuario = usuario
    
    return usuario


@pytest.fixture
def valid_registration_data():
    """
    Datos válidos para registro de usuario.
    
    Returns:
        Dict con datos de registro válidos.
    """
    return {
        "email": "nuevo.usuario@example.com",
        "contrasena": "SecurePass123!",
        "numero_documento": "98765432"  # DNI válido (8 dígitos)
    }


@pytest.fixture
def valid_login_data():
    """
    Datos válidos para login.
    
    Returns:
        Dict con credenciales de login válidas.
    """
    return {
        "email": "juan.perez@example.com",
        "contrasena": "password123"
    }


@pytest.fixture
def invalid_login_data():
    """
    Datos inválidos para login (varios escenarios).
    
    Returns:
        Lista de dicts con diferentes tipos de credenciales inválidas.
    """
    return [
        {
            "email": "noexiste@example.com",
            "contrasena": "password123",
            "error": "usuario_no_existe"
        },
        {
            "email": "juan.perez@example.com",
            "contrasena": "wrongpassword",
            "error": "password_incorrecto"
        },
        {
            "email": "invalid-email",
            "contrasena": "password123",
            "error": "email_invalido"
        }
    ]


@pytest.fixture
def valid_password_reset_token():
    """
    Token válido de recuperación de contraseña.
    
    Returns:
        String con token de recuperación.
    """
    return "valid_reset_token_12345"


@pytest.fixture
def expired_password_reset_token():
    """
    Token expirado de recuperación de contraseña.
    
    Returns:
        String con token expirado.
    """
    return "expired_reset_token_67890"

