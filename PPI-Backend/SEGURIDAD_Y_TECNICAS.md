# Seguridad y Técnicas Avanzadas - PPI Backend

## 📋 Índice
1. [Estrategias de Seguridad](#estrategias-de-seguridad)
2. [Uso de Redis](#uso-de-redis)
3. [Búsqueda Dinámica con Debounce](#búsqueda-dinámica-con-debounce)

---

## 🔒 Estrategias de Seguridad

### 1. Rate Limiting (Control de Intentos)

Implementamos un sistema de rate limiting basado en Redis que previene ataques de fuerza bruta y abuso de recursos.

#### Configuraciones por Endpoint:

- **Login**: 
  - 5 intentos por email cada 15 minutos
  - Previene ataques de fuerza bruta en autenticación
  
- **Registro**: 
  - 3 intentos por email cada hora
  - 5000 intentos por IP cada hora
  - Protege contra creación masiva de cuentas
  
- **Recuperación de Contraseña**: 
  - 3 intentos por email cada hora
  - 100 intentos por IP cada hora
  
- **Reset Password**: 
  - 100 intentos por IP cada hora

#### Características:
- Contadores independientes por IP y email
- Mensajes de error sin exponer información personal
- Reinicio automático después del período de ventana

**Ubicación**: `app/core/rate_limiting/limiter.py`

---

### 2. Sanitización de Strings

Protección contra inyección de código HTML/XSS en campos de texto del usuario.

#### Implementación:
- **Escape HTML**: Previene inyección de etiquetas HTML maliciosas
- **Límite de longitud**: Control de tamaño máximo por campo
- **Normalización**: Eliminación de múltiples saltos de línea consecutivos

#### Aplicación:
- Campos `nombres` y `apellidos` en registro de usuarios
- Campos de texto en creación de eventos y locales
- Validación automática mediante Pydantic validators

**Ejemplo**:
```python
@field_validator('nombres', 'apellidos')
def sanitize_names(cls, v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    return sanitize_text(v, max_length=50)
```

**Ubicación**: `app/utils/sanitizer.py`

---

### 3. Cookies HttpOnly (Implementación BFF)

Sistema de autenticación híbrido que utiliza un patrón **Backend-for-Frontend (BFF)** para garantizar la seguridad del token.

#### Arquitectura de Seguridad:
1. **Backend**: Genera y valida tokens JWT (Stateless), entregándolos en el cuerpo de la respuesta.
2. **Frontend (Next.js Server)**: Actúa como capa intermedia de seguridad. Recibe el token y lo establece como cookie HttpOnly antes de responder al cliente.

#### Características:
- **HttpOnly**: No accesibles desde JavaScript del navegador (protección XSS)
- **Secure**: Solo transmitidas por HTTPS en producción
- **SameSite**: `lax` para compatibilidad y seguridad
- **Desacoplamiento**: Permite despliegue Cross-Domain (Backend y Frontend en dominios distintos) sin problemas de cookies de terceros.

#### Ventajas sobre localStorage:
- Inmune a ataques XSS (JavaScript no puede leerlas)
- Enviadas automáticamente en cada request al servidor de Next.js
- Eliminación automática al expirar

**Ubicación Frontend**: `app/api/auth/set-token/route.ts` (Next.js API Route)

---

### 4. Tokens Temporales en Redis

Sistema de tokens efímeros para operaciones críticas como registro y recuperación de contraseña.

#### Características:
- **TTL Automático**: Expiración automática después de 15 minutos
- **Almacenamiento Temporal**: No se guardan en base de datos
- **Eliminación Automática**: Se borran después de uso exitoso
- **Seguridad**: Tokens aleatorios con `secrets.token_urlsafe(32)`

#### Casos de Uso:
1. **Registro de Usuarios**: Token de validación por email
2. **Recuperación de Contraseña**: Token para reset seguro

**Ejemplo**:
```python
token = secrets.token_urlsafe(32)
ttl_seconds = settings.REGISTRATION_TOKEN_EXPIRE_MINUTES * 60
success = await redis_client.store_registration_token(
    token=token,
    user_data=usuario_dict,
    ttl_seconds=ttl_seconds
)
```

**Ubicación**: `app/core/infrastructure/redis_client.py`

---

### 5. CORS (Cross-Origin Resource Sharing)

Configuración estricta de orígenes permitidos para prevenir ataques de origen cruzado.

#### Implementación:
- Lista blanca de dominios permitidos
- Configuración centralizada en settings
- Validación automática en cada request

**Ubicación**: `app/core/config.py` y `app/main.py`

---

## 🔴 Uso de Redis

Redis se utiliza en múltiples capas del sistema para mejorar rendimiento y seguridad.

### 1. Rate Limiting

Almacena contadores de intentos con expiración automática:
```python
# Clave: rate_limit:login:email:user@example.com
# Valor: contador de intentos
# TTL: 900 segundos (15 minutos)
```

### 2. Tokens Temporales

Almacenamiento seguro de tokens con datos asociados:
```python
# Clave: registration_token:{token}
# Valor: JSON con datos del usuario (email, password hasheado, etc.)
# TTL: 900 segundos (15 minutos)
```

### 3. Cache de Consultas

Sistema de caché inteligente para consultas frecuentes:
- **Eventos públicos**: Cache con TTL de 2-5 minutos
- **Listados filtrados**: Cache invalidation por tags
- **Prevención de cache stampede**: Sistema de locks distribuidos

#### Características del Cache:
- **Cache-aside pattern**: Verifica cache, si no existe consulta BD
- **Cache tags**: Invalidation selectiva por categorías
- **Distributed locks**: Previene múltiples queries simultáneas

**Ejemplo**:
```python
cache_key = self._build_cache_key(skip, limit, categoria_id, estado, periodo, busqueda)
return await CacheService.get_or_fetch(
    cache_key=cache_key,
    tag_key="cache_tags:eventos",
    fetch_fn=fetch,
    ttl=settings.CACHE_TTL_EVENTO_LIST
)
```

**Ubicación**: `app/services/shared/cache_service.py`

### 4. Configuración de Redis

- Pool de conexiones configurable
- Timeouts y health checks
- Reconexión automática
- Configuración por ambiente (dev/prod)

**Ubicación**: `app/core/infrastructure/redis_client.py`

---

## 🔍 Búsqueda Dinámica con Debounce

Sistema de búsqueda en tiempo real optimizado con debounce para reducir carga en el servidor.

### Arquitectura Frontend

#### 1. Hook de Debounce

Implementación personalizada que retrasa las búsquedas hasta que el usuario deje de escribir:

```typescript
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

**Características**:
- Delay de 500ms (configurable)
- Limpieza automática de timers
- Evita requests innecesarios

**Ubicación**: `lib/hooks/shared/use-debounce.ts`

#### 2. Búsqueda Dinámica en Endpoints

**Endpoints que soportan búsqueda**:

- **Eventos** (`GET /eventos/listar`):
  - Parámetro: `busqueda` (mínimo 2 caracteres)
  - Busca en: nombre y descripción
  - Usa: Full-Text Search de MySQL (MATCH AGAINST)

- **Locales** (`GET /local/listar/`):
  - Parámetro: `busqueda` (mínimo 2 caracteres)
  - Busca en: nombre y dirección

#### 3. Full-Text Search en MySQL

Para eventos, utilizamos búsqueda full-text nativa de MySQL para máximo rendimiento:

```python
if busqueda:
    from sqlalchemy import text
    
    busqueda_clean = busqueda.strip()
    conditions.append(
        text(
            "MATCH(Eventos.nombre, Eventos.descripcion) AGAINST(:busqueda IN BOOLEAN MODE)"
        ).bindparams(busqueda=f"{busqueda_clean}*")
    )
```

**Características**:
- Búsqueda con wildcard (`*`)
- Modo BOOLEAN para mayor control
- Búsqueda en múltiples columnas simultáneamente
- Muy rápido incluso con miles de registros

**Ubicación**: `app/repositories/eventos/evento_repository.py`

#### 4. Flujo Completo de Búsqueda

```
Usuario escribe → useDebounce (500ms) → Request al backend → 
Full-Text Search MySQL → Response → Actualización de UI
```

**Ejemplo en useEventosAdmin**:
```typescript
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearchTerm = useDebounce(searchTerm, 500)

useEffect(() => {
  if (isInitialized) {
    fetchEventos(0, pagination.limit)
  }
}, [filterCategoria, filterEstado, filterPeriodo, debouncedSearchTerm])
```

**Características del Flujo**:
1. Usuario escribe en input de búsqueda
2. Cada keystroke actualiza `searchTerm` (estado inmediato)
3. `debouncedSearchTerm` solo se actualiza después de 500ms sin cambios
4. Solo entonces se dispara la búsqueda al backend
5. Backend ejecuta Full-Text Search optimizado
6. Resultados se muestran inmediatamente

**Ubicación Frontend**: 
- `app/admin/hooks/use-eventos-admin.ts`
- `app/admin/hooks/use-locales-admin.ts`

---

## 🚀 Ventajas de estas Implementaciones

### Seguridad
- ✅ Protección contra ataques comunes (XSS, CSRF, brute force)
- ✅ Sin exposición de información sensible
- ✅ Validación y sanitización en múltiples capas

### Rendimiento
- ✅ Cache inteligente reduce carga en BD
- ✅ Debounce reduce requests innecesarios
- ✅ Full-Text Search nativo de MySQL
- ✅ Redis para operaciones ultra-rápidas

### Experiencia de Usuario
- ✅ Búsqueda en tiempo real sin lag perceptible
- ✅ Respuesta instantánea gracias al cache
- ✅ Mensajes de error claros y útiles

---

## 📚 Referencias Técnicas

- **Rate Limiting**: Redis + Sliding Window Algorithm
- **Sanitización**: Python `html.escape` + regex
- **Cookies**: HttpOnly, Secure, SameSite flags
- **Tokens**: `secrets.token_urlsafe()` (32 bytes)
- **Cache**: Cache-aside pattern con distributed locks
- **Búsqueda**: MySQL Full-Text Search (InnoDB)
- **Debounce**: React hooks con cleanup de timers


