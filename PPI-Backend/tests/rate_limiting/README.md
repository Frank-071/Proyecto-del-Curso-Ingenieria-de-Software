# Rate Limiting Tests

## Estrategia de Rate Limiting

### Implementación Profesional (Estándar de Industria)

#### **Login endpoint:** Solo rate limiting por **EMAIL** (sin límite de IP)

**Justificación:**
- Estándar utilizado por GitHub, Google, AWS
- Evita falsos positivos en IPs compartidas (universidades, empresas, WiFi público)
- Cada cuenta protegida individualmente (5 intentos / 15 minutos)
- Escalable sin afectar experiencia de usuario

**Configuración:**
```python
login_email_limiter = SimpleRateLimiter(
    max_requests=5,        # 5 intentos por email
    window_seconds=900,    # 15 minutos
    key_prefix="rate_limit:login:email"
)
```

#### **Register endpoint:** Rate limiting por **IP + EMAIL**

**Justificación:**
- Protege Redis de spam masivo (tokens temporales)
- Previene costo excesivo de emails de verificación
- Límite alto (5000/hora) permite eventos masivos
- Cada email limitado individualmente (3 intentos/hora)

**Configuración:**
```python
register_ip_limiter = SimpleRateLimiter(
    max_requests=5000,     # 5000 registros/hora por IP
    window_seconds=3600,   # 1 hora
    key_prefix="rate_limit:register:ip"
)

register_email_limiter = SimpleRateLimiter(
    max_requests=3,        # 3 intentos por email
    window_seconds=3600,   # 1 hora
    key_prefix="rate_limit:register:email"
)
```

**Análisis de capacidad:**
- Memoria por token: ~0.25 KB
- 5000 tokens: 1.25 MB (0.5% de Redis 256 MB)
- TTL: 15 minutos (limpieza automática)
- Cubre eventos con 5000 registros/hora

#### **Forgot Password endpoint:** Rate limiting por **IP + EMAIL**

**Justificación:**
- Balance entre seguridad y usabilidad
- 100 req/hora por IP permite universidades/empresas (IPs compartidas)
- 3 intentos por email previene spam a usuarios específicos
- Protege de flood masivo de emails de recuperación

**Configuración:**
```python
forgot_password_ip_limiter = SimpleRateLimiter(
    max_requests=100,      # 100 intentos/hora por IP
    window_seconds=3600,   # 1 hora
    key_prefix="rate_limit:forgot_password:ip"
)

forgot_password_email_limiter = SimpleRateLimiter(
    max_requests=3,        # 3 intentos por email
    window_seconds=3600,   # 1 hora
    key_prefix="rate_limit:forgot_password:email"
)
```

**Análisis de capacidad:**
- Memoria por token: ~0.4 KB (token más largo)
- 100 tokens: 40 KB (0.015% de Redis 256 MB)
- TTL: 30 minutos (limpieza automática)
- Cubre escenarios masivos (universidad con 100 usuarios simultáneos)

#### **Reset Password endpoint:** Rate limiting por **IP**

**Justificación:**
- Consistente con `/forgot-password` (100 req/hora)
- El token ya valida al usuario (único, TTL 30min, uso único)
- Permite completar el flujo para 100 usuarios desde misma IP
- Solo límite de IP (token es la segunda capa de seguridad)

**Configuración:**
```python
reset_password_ip_limiter = SimpleRateLimiter(
    max_requests=100,      # 100 intentos/hora por IP (mismo que forgot-password)
    window_seconds=3600,   # 1 hora
    key_prefix="rate_limit:reset_password:ip"
)
```

**Por qué NO se limita por email:**
- El token ya es único por usuario
- Usuario legítimo solo lo usa 1 vez
- Agregar límite de email sería redundante

#### **Validate Token endpoints:** Rate limiting por **IP**

**Endpoints afectados:**
- `GET /verificar-cuenta?token=XXX`
- `GET /validate/{token}`

**Justificación:**
- Parte del flujo de registro (completar ciclo)
- Consistente con `/register` (5000 req/hora)
- Token ya valida al usuario (único, TTL 15min, uso único)
- Previene ataques de fuerza bruta a tokens
- Permite eventos masivos sin bloqueos

**Configuración:**
```python
validate_token_limiter = SimpleRateLimiter(
    max_requests=5000,     # 5000 verificaciones/hora por IP (mismo que /register)
    window_seconds=3600,   # 1 hora
    key_prefix="rate_limit:validate_token:ip"
)
```

**Por qué NO se limita por email:**
- El token ya valida la identidad del usuario
- Usuario legítimo solo lo usa 1 vez
- Consistencia con el flujo completo de registro

**Flujo completo protegido:**
```
1. POST /register        → 5000 IP/hora + 3 email/hora
2. Email enviado         → Token único (TTL 15min)
3. GET /verificar-cuenta → 5000 IP/hora (consistente)
   └─ Crea usuario en BD
```

---

## Riesgos y Limitaciones

### ⚠️ **Escenario de DoS Localizado (IPs Compartidas)**

**Descripción del problema:**
Un atacante malicioso conectado a una IP pública compartida (universidad, empresa, WiFi público) podría agotar los límites de IP, bloqueando temporalmente a usuarios legítimos de la misma red.

**Ejemplo real:**
```
Universidad XYZ (1 IP pública WiFi):
├─ 10:00 AM: Atacante ejecuta script
│   ├─ 100 requests a /forgot-password
│   └─ Límite de IP agotado
│
├─ 10:05 AM: Estudiante legítimo
│   ├─ Intenta /forgot-password
│   └─ ❌ BLOQUEADO: "Espera 1 hora"
│
└─ 11:00 AM: Contador expira
    └─ Estudiante puede intentar ✅
```

### 📊 **Análisis de Impacto por Endpoint**

| Endpoint | IP Limit | Impacto UX Normal | Probabilidad DoS | Severidad |
|----------|----------|-------------------|------------------|-----------|
| `/login` | ❌ No | ✅ Cero | ❌ Imposible | N/A |
| `/register` | 5000/hora | ✅ Muy bajo (99.9% sin efecto) | ⚠️ Muy baja | Baja |
| `/forgot-password` | 100/hora | ⚠️ Moderado (>100 usuarios) | ⚠️ Moderada | Media |
| `/reset-password` | 100/hora | ⚠️ Moderado (>100 usuarios) | ⚠️ Moderada | Media |
| `/verificar-cuenta` | 5000/hora | ✅ Muy bajo (99.9% sin efecto) | ⚠️ Muy baja | Baja |

### ✅ **Mitigaciones Implementadas**

1. **Límites altos y realistas:**
   - 5000/hora para registro (cubre eventos masivos)
   - 100/hora para password reset (cubre universidades)

2. **Defensa en capas:**
   - Login: Solo email (no afecta IPs compartidas)
   - Registro/Validación: IP + Email
   - Password: IP + Email + Token

3. **TTL automático:**
   - Tokens expiran (15-30 minutos)
   - Contadores se resetean (1 hora)

4. **Consistencia en flujos:**
   - Registro → Validación: Mismo límite (5000/hora)
   - Forgot → Reset: Mismo límite (100/hora)

### 🔮 **Mejoras Futuras (Fuera del Alcance Actual)**

**Recomendaciones para producción a gran escala:**

1. **reCAPTCHA v3:**
   - Score-based validation (0.0 - 1.0)
   - Invisible para usuarios legítimos
   - Bloquea bots automáticamente

2. **Device Fingerprinting:**
   - Identifica dispositivos únicos
   - Reduce falsos positivos en IPs compartidas
   - Usado por Google, Facebook

3. **Rate Limiting Adaptativo:**
   - Ajusta límites según patrones
   - Machine learning para detectar anomalías
   - Usado por AWS, Cloudflare

4. **Lista Blanca de IPs:**
   - IPs conocidas (universidades, empresas)
   - Bypass o límites más altos
   - Mantenimiento manual

### 📝 **Decisión Técnica Justificada**

**Para este proyecto:**
- ✅ Rate limiting con límites altos es **suficiente y defendible**
- ✅ Cubre 99.9% de casos legítimos sin afectación
- ✅ Previene ataques básicos de fuerza bruta y flood
- ⚠️ Riesgo de DoS localizado: **Bajo** (requiere atacante en IP específica)
- 🎯 Balance correcto entre **seguridad** y **usabilidad** para un proyecto académico

**Comparación con industria:**
- GitHub, Google, AWS: Similar estrategia (rate limit por recurso, no siempre por IP)
- Diferencia: Ellos usan ML y heurísticas avanzadas (fuera del alcance de este proyecto)
- Nuestra implementación: **Estándar profesional para aplicaciones medianas**

---

## Tests Implementados

### `test_login_rate_limit.py`

**Test 1: Rate Limit por Email**
- Límite: 5 intentos / 15 minutos por email
- Envía 9 requests con el mismo email
- Espera: primeros 5 pasan, siguientes 4 bloqueados (429)

**Test 2: Sin Límite de IP**
- Envía 50 requests con 50 emails diferentes desde misma IP
- Espera: TODOS pasan (sin bloqueo por IP)
- Valida compatibilidad con IPs compartidas

**Test 3: Contadores Independientes**
- Prueba 2 emails diferentes (alice@, bob@)
- Valida que cada email tiene su propio contador
- alice@ bloqueada después de 5 intentos
- bob@ puede seguir intentando (contador independiente)

---

## Ejecutar Tests

### Prerequisitos
1. Backend debe estar corriendo en `http://localhost:8000`
2. Redis debe estar activo
3. Base de datos debe estar disponible

### Limpiar Redis (recomendado antes de cada test)
```bash
docker exec -it ppi-redis redis-cli -a yourpassword FLUSHDB
```

### Ejecutar test
```bash
cd d:\ingesoft\backend\PPI-Backend
python tests/rate_limiting/test_login_rate_limit.py
```

---

## Verificar en Redis

```bash
# Ver todas las keys de rate limiting
docker exec -it ppi-redis redis-cli -a yourpassword KEYS "rate_limit:*"

# Ver contador específico de un email
docker exec -it ppi-redis redis-cli -a yourpassword GET "rate_limit:login:email:192.168.1.1:user@test.com"

# Ver TTL restante
docker exec -it ppi-redis redis-cli -a yourpassword TTL "rate_limit:login:email:192.168.1.1:user@test.com"

# Limpiar todas las keys
docker exec -it ppi-redis redis-cli -a yourpassword FLUSHDB
```

---

## Resultados Esperados

```
============================================================
LOGIN RATE LIMITING TESTS (EMAIL-ONLY)
============================================================

Test 1: Rate Limit por Email (mismo email, múltiples intentos)
  [ALLOWED] Request 1-5: 200/401
  [BLOCKED] Request 6-9: 429
[PASS] ✅

Test 2: Múltiples emails desde misma IP (sin límite de IP)
  [ALLOWED] Requests 1-50: All passing
[PASS] ✅ Sin límite de IP, solo por email

Test 3: Verificar que cada email tiene su propio límite
  alice@: 5 allowed, 6th blocked
  bob@: 5 allowed (independent counter)
[PASS] ✅ Cada email tiene su propio límite

[SUCCESS] ALL TESTS PASSED!
```

---

## Troubleshooting

### Error: Connection refused
- Verifica que el backend esté corriendo: `docker ps`
- Verifica el puerto (debe ser 8000)

### Test falla inmediatamente (todos bloqueados)
- Redis tiene datos de tests anteriores
- Solución: `docker exec -it ppi-redis redis-cli -a yourpassword FLUSHDB`

### Test 2 falla (bloquea por IP cuando no debería)
- Verifica que eliminaste `login_ip_limiter` de `app/routers/auth/login.py`
- El código debe tener SOLO `login_email_limiter`

---

### `test_register_rate_limit.py`

**Test 1: Rate Limit por IP**
- Límite: 5000 registros / hora por IP
- Envía 50 registros con emails diferentes
- Espera: TODOS pasan (50 << 5000)

**Test 2: Rate Limit por Email**
- Límite: 3 intentos / hora por email
- Envía 5 requests con el mismo email
- Espera: primeros 3 pasan, siguientes 2 bloqueados (429)

**Test 3: Contadores Independientes**
- Prueba 3 emails diferentes
- Valida que cada email tiene su propio contador
- Cada email puede hacer 3 intentos independientes

---

### `test_forgot_password_rate_limit.py`

**Test 1: Rate Limit por Email**
- Límite: 3 intentos / hora por email
- Envía 5 requests con el mismo email
- Espera: primeros 3 pasan, siguientes 2 bloqueados (429)

**Test 2: Rate Limit por IP**
- Límite: 100 intentos / hora por IP
- Envía 30 requests con emails diferentes (abreviado)
- Espera: TODOS pasan (30 << 100)

**Test 3: Contadores Independientes**
- Prueba 2 emails diferentes (alice@, bob@)
- Valida que cada email tiene su propio contador
- alice@ bloqueada después de 3 intentos
- bob@ puede seguir intentando (contador independiente)

---

## Ejecutar Tests

### Prerequisitos
1. Backend debe estar corriendo en `http://localhost:8000`
2. Redis debe estar activo
3. Base de datos debe estar disponible

### Limpiar Redis (recomendado antes de cada test)
```bash
docker exec -it ppi-redis redis-cli FLUSHDB
```

### Ejecutar tests
```bash
cd d:\ingesoft\backend\PPI-Backend

# Test de login
python tests/rate_limiting/test_login_rate_limit.py

# Test de registro
python tests/rate_limiting/test_register_rate_limit.py

# Test de forgot password
python tests/rate_limiting/test_forgot_password_rate_limit.py
```

