# PPI Backend API - Documentación para Frontend

## Base URL
```
http://localhost:8000
```

## Documentación Automática
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Estructura de Respuesta Estándar

Todas las respuestas siguen este formato:

```json
{
    "success": true,
    "message": "Descripción del resultado",
    "data": [...] // Array de objetos o null si hay error
}
```

## Endpoints Disponibles

### 1. Departamentos

#### Listar todos los departamentos
```http
GET /departamento/listar/
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Departamentos obtenidos exitosamente",
    "data": [
        {
            "id": 1,
            "nombre": "Amazonas",
            "ubigeo": "01"
        },
        {
            "id": 2,
            "nombre": "Áncash",
            "ubigeo": "02"
        }
        // ... más departamentos
    ]
}
```

### 2. Provincias

#### Listar todas las provincias
```http
GET /provincia/listar/
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Provincias obtenidas exitosamente",
    "data": [
        {
            "id": 1,
            "departamento_id": 15,
            "nombre": "Lima",
            "ubigeo": "1501"
        },
        {
            "id": 2,
            "departamento_id": 15,
            "nombre": "Barranca",
            "ubigeo": "1502"
        }
        // ... más provincias
    ]
}
```

#### Listar provincias por departamento
```http
GET /provincia/departamento/{departamento_id}
```

**Parámetros:**
- `departamento_id` (int): ID del departamento (debe ser mayor a 0)

**Ejemplo:**
```http
GET /provincia/departamento/15
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Provincias del departamento 15 obtenidas exitosamente",
    "data": [
        {
            "id": 1,
            "departamento_id": 15,
            "nombre": "Lima",
            "ubigeo": "1501"
        }
        // ... provincias del departamento 15
    ]
}
```

### 3. Distritos

#### Listar todos los distritos
```http
GET /distrito/listar/
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Distritos obtenidos exitosamente",
    "data": [
        {
            "id": 1,
            "provincia_id": 1,
            "nombre": "Lima"
        },
        {
            "id": 2,
            "provincia_id": 1,
            "nombre": "Ancón"
        }
        // ... más distritos
    ]
}
```

#### Listar distritos por provincia
```http
GET /distrito/provincia/{provincia_id}
```

**Parámetros:**
- `provincia_id` (int): ID de la provincia (debe ser mayor a 0)

**Ejemplo:**
```http
GET /distrito/provincia/1
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Distritos de la provincia 1 obtenidos exitosamente",
    "data": [
        {
            "id": 1,
            "provincia_id": 1,
            "nombre": "Lima"
        },
        {
            "id": 2,
            "provincia_id": 1,
            "nombre": "Ancón"
        }
        // ... distritos de la provincia 1
    ]
}
```

### 4. Tipos de Locales

#### Listar todos los tipos de locales
```http
GET /tipo-local/listar/
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Tipos de locales obtenidos exitosamente",
    "data": [
        {
            "id": 1,
            "nombre": "Estadio",
            "descripcion": null
        },
        {
            "id": 2,
            "nombre": "Teatro",
            "descripcion": null
        }
        // ... más tipos de locales
    ]
}
```

### 5. Locales

#### Listar todos los locales
```http
GET /local/listar/
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Locales obtenidos exitosamente",
    "data": [
        // ... estructura de locales (verificar con el endpoint)
    ]
}
```

### 6. Categorías de Evento

#### Listar todas las categorías de evento
```http
GET /categoria-evento/listar/
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Categorías de evento obtenidas exitosamente",
    "data": [
        {
            "id": 1,
            "nombre": "Conciertos",
            "descripcion": "Eventos musicales en vivo"
        },
        {
            "id": 2,
            "nombre": "Conferencias",
            "descripcion": "Presentaciones informativas o académicas"
        },
        {
            "id": 3,
            "nombre": "Teatro",
            "descripcion": "Representaciones dramáticas en vivo"
        }
        // ... más categorías de evento
    ]
}
```

## Manejo de Errores

### Error 404 - Endpoint no encontrado
```json
{
    "detail": "Not Found"
}
```

### Error 500 - Error interno
```json
{
    "detail": "Error interno de base de datos"
}
```

### Error 422 - Parámetros inválidos
```json
{
    "detail": [
        {
            "loc": ["path", "departamento_id"],
            "msg": "ensure this value is greater than 0",
            "type": "value_error.number.not_gt",
            "ctx": {"limit_value": 0}
        }
    ]
}
```

## Códigos de Estado HTTP

- `200`: Éxito
- `404`: Recurso no encontrado
- `422`: Error de validación de parámetros
- `500`: Error interno del servidor

## Ejemplos de Uso en Python (Requests)

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000"

# Obtener todos los departamentos
response = requests.get(f"{BASE_URL}/departamento/listar/")
departamentos = response.json()["data"]

# Obtener provincias de un departamento específico
departamento_id = 15
response = requests.get(f"{BASE_URL}/provincia/departamento/{departamento_id}")
provincias = response.json()["data"]

# Obtener distritos de una provincia específica
provincia_id = 1
response = requests.get(f"{BASE_URL}/distrito/provincia/{provincia_id}")
distritos = response.json()["data"]

# Obtener tipos de locales
response = requests.get(f"{BASE_URL}/tipo-local/listar/")
tipos_locales = response.json()["data"]

# Obtener categorías de evento
response = requests.get(f"{BASE_URL}/categoria-evento/listar/")
categorias_evento = response.json()["data"]
```

## Headers Recomendados

```http
Content-Type: application/json
Accept: application/json
```

## CORS

El API está configurado para aceptar peticiones desde:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Notas Importantes

1. **Jerarquía Geográfica**: Departamento → Provincia → Distrito
2. **IDs**: Todos los IDs deben ser números enteros mayores a 0
3. **Descripción**: El campo `descripcion` en tipos de locales puede ser `null`
4. **Paginación**: Actualmente no implementada (se devuelven todos los registros)
5. **Autenticación**: Actualmente no implementada
6. **Rate Limiting**: Actualmente no implementado

## Próximas Funcionalidades (Sugeridas)

- Paginación en endpoints con muchos registros
- Filtros adicionales (búsqueda por nombre)
- Endpoints para crear, actualizar y eliminar entidades
- Autenticación y autorización
- Cache de respuestas