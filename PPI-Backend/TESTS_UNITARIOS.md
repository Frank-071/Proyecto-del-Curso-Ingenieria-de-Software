# Tests Unitarios - PPI Backend

## 📋 Resumen

Documentación breve de los tests unitarios enfocados en:
- ✅ **Tests de Eventos** (CRUD y listado)
- ✅ **Tests de Locales** (CRUD y listado)
- ✅ **Tests de Autenticación/Usuarios** (Login, Registro, Reset Password, CRUD)

---

## 🎯 Tests de Eventos

### Ubicación
- `tests/unit/eventos/test_evento_service_crud.py` - Tests de operaciones CRUD
- `tests/unit/eventos/test_evento_service_list.py` - Tests de listado y filtros

### `test_evento_service_crud.py`

**Cobertura:**
- ✅ **GetById**: Obtener evento por ID exitoso y cuando no existe (404)
- ✅ **Create**: Crear evento con validación de fechas y datos
- ✅ **Update**: Actualizar evento con validación de integridad
- ✅ **Delete**: Eliminar evento con manejo de errores
- ✅ **Estado**: Cambiar estado del evento (Borrador, Publicado, etc.)
- ✅ **Validaciones**: Fechas inválidas (inicio >= fin), errores de integridad

**Características:**
- Mocks de repositorios y cache
- Validación de relaciones (local, categoría, organizador)
- Manejo de errores de integridad de BD

### `test_evento_service_list.py`

**Cobertura:**
- ✅ **Listado con paginación**: Skip, limit, total, hasNext, hasPrev
- ✅ **Campos calculados**: `local_nombre` agregado dinámicamente
- ✅ **Cache key determinístico**: Mismas condiciones = misma clave
- ✅ **Cálculo de períodos**: `proximos_7_dias`, `este_mes`, `proximo_mes`
- ✅ **Eventos públicos**: Listado filtrado por estado "Publicado" y "Proximamente"
- ✅ **Campos adicionales**: `categoria_nombre` en eventos públicos

**Características:**
- Mock del sistema de cache (CacheService)
- Validación de paginación completa
- Tests de filtros por período temporal

---

## 🏪 Tests de Locales

### Ubicación
- `tests/unit/locales/test_local_service_crud.py` - Tests de operaciones CRUD
- `tests/unit/locales/test_local_service_list.py` - Tests de listado y cache
- `tests/unit/locales/test_local_service_minimal.py` - Tests mínimos

### `test_local_service_crud.py`

**Cobertura:**
- ✅ **GetById**: Obtener local por ID con relaciones (distrito, tipo_local)
- ✅ **Create**: Crear local con validación de relaciones
- ✅ **Update**: Actualizar local con manejo de integridad
- ✅ **Delete**: Eliminar local
- ✅ **Toggle Estado**: Activar/desactivar local
- ✅ **Errores de integridad**: Distrito inválido, tipo_local inválido

**Características:**
- Validación de relaciones FK (distrito_id, tipo_local_id)
- Invalidación de cache después de operaciones
- Manejo de errores de BD con mensajes claros

### `test_local_service_list.py`

**Cobertura:**
- ✅ **Listado con paginación**: Skip, limit, total, currentPage, totalPages
- ✅ **Campos calculados**: `distrito_nombre`, `tipo_local_nombre`
- ✅ **Cache key determinístico**: Incluye todos los filtros
- ✅ **Filtros**: Por tipo_local_id, activo, distrito_id, búsqueda
- ✅ **Fallbacks**: Manejo de relaciones None (distrito/tipo_local)

**Características:**
- Cache key incluye: skip, limit, tipo_local, activo, distrito, búsqueda
- Validación de invalidation de cache
- Tests de casos edge (relaciones None)

---

## 🔐 Tests de Autenticación/Usuarios

### Ubicación
- `tests/unit/auth/test_auth_service.py` - Tests de login y autenticación
- `tests/unit/auth/test_registration_service.py` - Tests de registro
- `tests/unit/auth/test_password_reset_service.py` - Tests de recuperación de contraseña
- `tests/unit/auth/test_usuario_service.py` - Tests de CRUD de usuarios

### `test_auth_service.py` (16 tests)

**Cobertura:**
- ✅ **Login Cliente**: Login exitoso con datos de cliente (puntos, rango)
- ✅ **Login Admin**: Login exitoso con nivel_acceso
- ✅ **Credenciales inválidas**: Email no existe, contraseña incorrecta
- ✅ **Usuario inactivo**: Login bloqueado para usuarios desactivados
- ✅ **Obtener rol**: Cliente, Admin, auto-creación de cliente si no tiene rol
- ✅ **Generar respuesta**: Incluye token JWT, datos de usuario, datos de cliente
- ✅ **Login después de verificación**: Login post-verificación de email

**Características:**
- Mocks de `verify_password` (bcrypt)
- Mocks de `create_access_token` (JWT)
- Validación de estructura de respuesta
- Verificación de roles y permisos

### `test_registration_service.py` (30 tests)

**Cobertura:**
- ✅ **Validación de documento**: DNI (8 dígitos → tipo_id=1), CE/Pasaporte (12 dígitos → tipo_id=2)
- ✅ **Documentos inválidos**: 14 casos edge (vacío, 1-7, 9-11, 13-15 dígitos)
- ✅ **Registro exitoso**: Con DNI y CE, hash de contraseña, generación de token
- ✅ **Guardado en Redis**: Token con TTL de 15 minutos
- ✅ **Validación de duplicados**: Email duplicado, documento duplicado
- ✅ **Validación de token**: Token válido crea usuario y cliente, elimina token
- ✅ **Token inválido/expirado**: Manejo de errores apropiado

**Características:**
- Tests parametrizados para documentos válidos/inválidos
- Mocks de Redis (store_registration_token, get_registration_data)
- Validación de hash de contraseña
- Tests de flujo completo de registro

### `test_password_reset_service.py` (11 tests)

**Cobertura:**
- ✅ **Solicitud exitosa**: Genera token aleatorio, guarda en Redis con TTL
- ✅ **Email no existe**: Error apropiado sin exponer información
- ✅ **Token generado aleatoriamente**: Verificación de `secrets.token_urlsafe()`
- ✅ **TTL configurado**: 15 minutos (900 segundos)
- ✅ **Reset exitoso**: Hashea nueva contraseña, actualiza BD, elimina token
- ✅ **Token inválido/expirado**: Manejo de errores TokenError
- ✅ **Falla actualización BD**: Rollback apropiado
- ✅ **Eliminación de token**: Solo si reset es exitoso

**Características:**
- Mocks de Redis para tokens temporales
- Validación de hash de nueva contraseña
- Tests de integración del flujo completo

### `test_usuario_service.py` (18 tests)

**Cobertura:**
- ✅ **GetAllUsuarios**: Lista vacía y lista con múltiples usuarios
- ✅ **GetUsuarioById**: Usuario existente y error cuando no existe
- ✅ **CreateUsuario**: Creación exitosa, hash de contraseña, creación de cliente asociado
- ✅ **UpdateUsuario**: Actualización exitosa, hash de nueva contraseña
- ✅ **DeleteUsuario**: Eliminación exitosa y error cuando no existe
- ✅ **ValidarUsuarioExists**: Verificación de existencia sin error / BusinessError 404
- ✅ **PrepareUsuarioData**: Preparación de datos con hash de contraseña
- ✅ **Integración CRUD**: Flujo completo Create → Read → Update → Delete

**Características:**
- Tests de CRUD completo
- Validación de hash de contraseña en create/update
- Manejo de errores con rollback de transacciones
- Validación de relaciones (creación automática de cliente)

---

## 🛠️ Características Comunes

### Arquitectura de Tests
- ✅ **Mocks aislados**: No dependen de BD/Redis real
- ✅ **Fixtures reutilizables**: Mock de DB, Redis, objetos de prueba
- ✅ **Tests rápidos**: Ejecución en ~5-6 segundos para todos los tests
- ✅ **Sin warnings**: Código modernizado (SQLAlchemy 2.0, async/await correcto)

### Patrones Usados
- **Arrange-Act-Assert**: Estructura clara en cada test
- **Parametrización**: Tests con múltiples casos (pytest.mark.parametrize)
- **AsyncMock**: Para funciones asíncronas
- **MagicMock**: Para objetos complejos con relaciones

### Fixtures Disponibles
- `mock_db`: Mock de AsyncSession (SQLAlchemy)
- `mock_redis`: Mock de cliente Redis
- `mock_usuario_cliente`: Usuario con rol cliente y datos completos
- `mock_usuario_admin`: Usuario con rol admin
- `mock_evento_list`: Lista de eventos para tests de listado
- `mock_local_list`: Lista de locales para tests de listado
- `valid_registration_data`: Datos válidos para registro

---

## 📊 Estadísticas

### Tests por Módulo

| Módulo | Archivos | Tests | Cobertura |
|--------|----------|-------|-----------|
| **Eventos** | 2 | ~10-12 | CRUD + Listado completo |
| **Locales** | 3 | ~15-18 | CRUD + Listado + Cache |
| **Auth** | 4 | 75 | 89% del módulo auth |
| **TOTAL** | 9 | ~100+ | Excelente cobertura |

### Cobertura de Servicios Auth

| Servicio | Tests | Cobertura | Estado |
|----------|-------|-----------|--------|
| `AuthService` | 16 | **100%** | ✅ Completo |
| `PasswordResetService` | 11 | **100%** | ✅ Completo |
| `RegistrationService` | 30 | **93%** | ✅ Casi completo |
| `UsuarioService` | 18 | **75%** | ✅ CRUD completo |

---

## 🚀 Cómo Ejecutar

### Todos los tests unitarios:
```bash
pytest tests/unit/ -v
```

### Tests de eventos:
```bash
pytest tests/unit/eventos/ -v
```

### Tests de locales:
```bash
pytest tests/unit/locales/ -v
```

### Tests de auth:
```bash
pytest tests/unit/auth/ -v
```

### Con cobertura:
```bash
pytest tests/unit/auth/ --cov=app.services.auth --cov-report=html
```

### Test específico:
```bash
pytest tests/unit/eventos/test_evento_service_crud.py::TestGetById::test_get_por_id_ok -v
```

---

## ✅ Ventajas de estos Tests

1. **Rápidos**: Ejecución en segundos (sin infraestructura real)
2. **Aislados**: No dependen de BD, Redis, o servicios externos
3. **Deterministas**: Sin flakiness, siempre mismo resultado
4. **Documentados**: Cada test explica qué valida
5. **Mantenibles**: Fixtures reutilizables y estructura clara
6. **Alta cobertura**: Casos exitosos y de error cubiertos
7. **Profesionales**: Siguen mejores prácticas de testing

---

## 🎯 Casos Cubiertos

### Eventos
- ✅ CRUD completo
- ✅ Validación de fechas
- ✅ Filtros dinámicos (categoría, estado, período)
- ✅ Paginación
- ✅ Cache

### Locales
- ✅ CRUD completo
- ✅ Validación de relaciones FK
- ✅ Filtros múltiples
- ✅ Cache con invalidación
- ✅ Manejo de relaciones None

### Auth/Usuarios
- ✅ Login cliente/admin
- ✅ Registro con validación de documentos
- ✅ Recuperación de contraseña
- ✅ CRUD de usuarios
- ✅ Hash de contraseñas
- ✅ Tokens temporales en Redis
- ✅ Manejo de errores completo

---

## 📚 Referencias

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [Unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)


