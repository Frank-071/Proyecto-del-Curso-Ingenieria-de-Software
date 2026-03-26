# Estructura de Sesiones en Redis

Este documento describe la estructura de datos almacenada en Redis para el sistema de gestión de sesiones y detección de dispositivos sospechosos.

## Claves en Redis

El sistema utiliza dos tipos de claves en Redis por usuario:

1. **Session Version**: `user:{user_id}:session_version`
2. **Known Devices**: `user:{user_id}:devices`

---

## 1. Session Version

### Clave
```
user:{user_id}:session_version
```

### Tipo de Dato
**String** (número entero como string)

### Propósito
Almacena la versión actual de sesión del usuario. Se incrementa cada vez que se cierran todas las sesiones, invalidando todos los tokens anteriores.

### Estructura
```
user:123:session_version = "3"
```

### Operaciones

#### Creación/Inicialización
- **Cuando**: Primer login del usuario
- **Valor inicial**: `1` (implícito, no se crea en Redis hasta que se cierra sesión)
- **Acción**: No se crea la clave hasta que el usuario cierra todas las sesiones por primera vez

#### Actualización
- **Cuando**: Usuario hace "cerrar todas las sesiones"
- **Acción**: 
  - Si la clave no existe: se crea con valor `2`
  - Si la clave existe: se incrementa con `INCR`

#### Lectura
- **Cuando**: 
  - Durante el login (para asignar session_version al token)
  - Durante la validación de tokens (para verificar si el token es válido)
- **Valor por defecto**: Si no existe, se retorna `1`

### Ejemplo de Flujo

```
Usuario ID: 123

1. Primer login:
   - Redis: (clave no existe)
   - Token generado con: session_version = 1
   - Redis: (sigue sin existir)

2. Usuario cierra todas las sesiones:
   - Redis: user:123:session_version = "2"
   - Todos los tokens con session_version = 1 quedan inválidos

3. Usuario inicia sesión nuevamente:
   - Redis: user:123:session_version = "2"
   - Token generado con: session_version = 2

4. Usuario cierra todas las sesiones nuevamente:
   - Redis: user:123:session_version = "3"
   - Todos los tokens con session_version = 1 o 2 quedan inválidos
```

### Ejemplo Real en Redis

```redis
# Comando Redis
GET user:123:session_version

# Respuesta
"3"
```

---

## 2. Known Devices

### Clave
```
user:{user_id}:devices
```

### Tipo de Dato
**Redis Hash** (Hash field-value pairs)

### Propósito
Almacena información de dispositivos conocidos del usuario para detectar dispositivos sospechosos en logins posteriores.

### Estructura

Cada campo del hash es un **device_hash** (SHA256 de `user_agent:ip`) y el valor es un JSON con la información del dispositivo.

#### Formato del Hash
```
user:{user_id}:devices
  ├── {device_hash_1}: "{JSON device_data_1}"
  ├── {device_hash_2}: "{JSON device_data_2}"
  └── {device_hash_3}: "{JSON device_data_3}"
```

#### Estructura del JSON (device_data)
```json
{
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "ip": "192.168.1.100",
  "device_hash": "a1b2c3d4e5f6...",
  "session_version": 3,
  "first_seen": "2025-01-15T10:30:00.000000+00:00",
  "last_seen": "2025-01-15T14:45:00.000000+00:00"
}
```

### Campos del JSON

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_agent` | string | User-Agent del navegador/dispositivo |
| `ip` | string | Dirección IP del cliente |
| `device_hash` | string | Hash SHA256 de `{user_agent}:{ip}` |
| `session_version` | integer | Versión de sesión cuando se creó/actualizó el dispositivo |
| `first_seen` | string | Fecha y hora UTC de la primera vez que se vio este dispositivo (ISO 8601) |
| `last_seen` | string | Fecha y hora UTC de la última vez que se vio este dispositivo (ISO 8601) |

### Operaciones

#### Creación
- **Cuando**: Primer login desde un dispositivo nuevo
- **Acción**: Se crea un nuevo campo en el hash con el device_hash como clave

#### Actualización
- **Cuando**: Login desde un dispositivo conocido
- **Acción**: Se actualiza `last_seen` y `session_version` del dispositivo

#### Lectura
- **Cuando**: 
  - Durante el login (para detectar dispositivos sospechosos)
  - Se usa pipeline para leer junto con session_version

### Ejemplo de Flujo

```
Usuario ID: 123

1. Primer login desde Laptop (Windows, Chrome):
   - Device Hash: "abc123def456..."
   - Redis Hash: 
     user:123:devices
       abc123def456...: {
         "user_agent": "Mozilla/5.0 (Windows NT 10.0...)",
         "ip": "192.168.1.100",
         "device_hash": "abc123def456...",
         "session_version": 1,
         "first_seen": "2025-01-15T10:30:00.000000+00:00",
         "last_seen": "2025-01-15T10:30:00.000000+00:00"
       }
   - Es dispositivo nuevo: NO (primera vez del usuario)
   - Alerta: NO se envía

2. Login desde Móvil (Android, Chrome):
   - Device Hash: "xyz789uvw012..."
   - Redis Hash:
     user:123:devices
       abc123def456...: {...}
       xyz789uvw012...: {
         "user_agent": "Mozilla/5.0 (Linux; Android 10...)",
         "ip": "192.168.1.101",
         "device_hash": "xyz789uvw012...",
         "session_version": 1,
         "first_seen": "2025-01-15T11:00:00.000000+00:00",
         "last_seen": "2025-01-15T11:00:00.000000+00:00"
       }
   - Es dispositivo nuevo: SÍ (usuario ya tiene dispositivos conocidos)
   - Alerta: SÍ se envía por email

3. Login nuevamente desde Laptop:
   - Device Hash: "abc123def456..." (ya existe)
   - Redis Hash:
     user:123:devices
       abc123def456...: {
         ...
         "session_version": 2,
         "last_seen": "2025-01-15T14:45:00.000000+00:00"
       }
   - Es dispositivo nuevo: NO (dispositivo conocido)
   - Alerta: NO se envía
```

### Ejemplo Real en Redis

#### Comando Redis
```redis
HGETALL user:123:devices
```

#### Respuesta
```
1) "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890"
2) "{\"user_agent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\",\"ip\":\"192.168.1.100\",\"device_hash\":\"abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890\",\"session_version\":3,\"first_seen\":\"2025-01-15T10:30:00.000000+00:00\",\"last_seen\":\"2025-01-15T14:45:00.000000+00:00\"}"
3) "xyz789uvw0123456abcdef7890123456abcdef7890123456abcdef7890123456"
4) "{\"user_agent\":\"Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36\",\"ip\":\"192.168.1.101\",\"device_hash\":\"xyz789uvw0123456abcdef7890123456abcdef7890123456abcdef7890123456\",\"session_version\":2,\"first_seen\":\"2025-01-15T11:00:00.000000+00:00\",\"last_seen\":\"2025-01-15T13:20:00.000000+00:00\"}"
```

#### Formato Legible (JSON parseado)
```json
{
  "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890": {
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "ip": "192.168.1.100",
    "device_hash": "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "session_version": 3,
    "first_seen": "2025-01-15T10:30:00.000000+00:00",
    "last_seen": "2025-01-15T14:45:00.000000+00:00"
  },
  "xyz789uvw0123456abcdef7890123456abcdef7890123456abcdef7890123456": {
    "user_agent": "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36",
    "ip": "192.168.1.101",
    "device_hash": "xyz789uvw0123456abcdef7890123456abcdef7890123456abcdef7890123456",
    "session_version": 2,
    "first_seen": "2025-01-15T11:00:00.000000+00:00",
    "last_seen": "2025-01-15T13:20:00.000000+00:00"
  }
}
```

---

## Operaciones Optimizadas

### Pipeline para Lectura Simultánea

Durante el login, se leen ambas claves en una sola operación usando pipeline:

```python
pipe = redis.pipeline()
pipe.get(f"user:{user_id}:session_version")
pipe.hgetall(f"user:{user_id}:devices")
results = await pipe.execute()

session_version = int(results[0]) if results[0] else 1
devices = parse_json_devices(results[1])
```

### Comandos Redis Equivalentes

```redis
MULTI
GET user:123:session_version
HGETALL user:123:devices
EXEC
```

---

## Escalabilidad

### Tamaño de Datos

#### Session Version
- **Tamaño por usuario**: ~30 bytes (clave + valor)
- **1,000,000 usuarios**: ~30 MB

#### Known Devices
- **Tamaño por dispositivo**: ~200-500 bytes (dependiendo del user_agent)
- **Usuario con 3 dispositivos**: ~1-1.5 KB
- **100,000 usuarios con 3 dispositivos promedio**: ~100-150 MB

### Rendimiento

- **Lectura**: O(1) para session_version, O(n) para devices (donde n = número de dispositivos)
- **Escritura**: O(1) para ambas operaciones
- **Pipeline**: Reduce latencia al leer ambas claves simultáneamente

---

## Casos de Uso

### 1. Login Normal
1. Leer `session_version` y `devices` (pipeline)
2. Generar `device_hash` del request actual
3. Verificar si el dispositivo es conocido
4. Si es nuevo y hay dispositivos previos → enviar alerta
5. Guardar/actualizar dispositivo en `devices`
6. Generar token con `session_version` y `jti`

### 2. Validación de Token
1. Decodificar JWT
2. Leer `session_version` de Redis
3. Comparar `session_version` del token con Redis
4. Si `token_version < redis_version` → token inválido
5. Si `token_version >= redis_version` → token válido

### 3. Cerrar Todas las Sesiones
1. Leer `session_version` actual
2. Incrementar `session_version` (o crear con valor 2 si no existe)
3. Todos los tokens con versión anterior quedan inválidos

### 4. Detección de Dispositivo Sospechoso
1. Leer `devices` del usuario
2. Comparar `device_hash` actual con dispositivos conocidos
3. Si no existe y hay dispositivos previos → dispositivo sospechoso
4. Si es el primer dispositivo del usuario → no es sospechoso

---

## Mantenimiento

### Limpieza de Datos

Los datos se mantienen indefinidamente en Redis. Para limpiar datos antiguos:

```redis
# Eliminar session_version de un usuario
DEL user:123:session_version

# Eliminar todos los dispositivos de un usuario
DEL user:123:devices

# Eliminar un dispositivo específico
HDEL user:123:devices abc123def456...
```

### Monitoreo

```redis
# Ver todas las claves de session_version
KEYS user:*:session_version

# Ver todas las claves de devices
KEYS user:*:devices

# Contar dispositivos de un usuario
HLEN user:123:devices
```

---

## Notas Importantes

1. **Session Version**: No se crea hasta que el usuario cierra todas las sesiones por primera vez
2. **Device Hash**: Se calcula como SHA256 de `{user_agent.lower().strip()}:{ip}`
3. **Compatibilidad**: Tokens sin `session_version` (tokens antiguos) siguen funcionando
4. **Degradación**: Si Redis falla, el sistema continúa funcionando (no bloquea)
5. **Timezone**: Todas las fechas se almacenan en UTC (ISO 8601)

