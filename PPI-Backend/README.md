# PPI Backend - FastAPI

⚠️ **IMPORTANTE:** Hacerlo con cariño pa venderlo despues :v

## 🚀 Comandos para levantar el proyecto

### Primera vez o después de cambios en dependencias:
```bash
docker-compose build
docker-compose up
```

### Solo cambios de código:
```bash
docker-compose up
```

### Detener el proyecto:
```bash
# Si vas a parar un rato solo haz Ctrl+C 2 veces en la terminal
# Si ya no vas a continuar hasta el otro día Ctrl+C x2 y docker-compose down
docker-compose down
```

## 📋 URLs importantes

- **API**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **Documentación ReDoc**: http://localhost:8000/redoc

## 🔄 Cuando la rama main tiene nuevos cambios

```bash
git pull
docker-compose build  # Solo si hay cambios en requirements.txt
docker-compose up
```

## ⚙️ Variables de entorno

Copia `.env.example` y crea los siguientes archivos según el entorno:
- `.env.development` para desarrollo local
- `.env.production` para producción en AWS EC2

Asegúrate de NO subir estos archivos al repositorio (ya están en `.gitignore`).

### Selección de entorno

El backend selecciona el archivo de entorno según la variable de entorno `ENVIRONMENT`:
- `ENVIRONMENT=development` → usa `.env.development`
- `ENVIRONMENT=production` → usa `.env.production`
- Si no se define, usa `.env`

Puedes definir la variable al iniciar el backend, por ejemplo:

```powershell
$env:ENVIRONMENT="production"; uvicorn app.main:app --host 0.0.0.0 --port 8000
```

O en Linux:
```bash
ENVIRONMENT=production uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 📐 Arquitectura Estandarizada

Este proyecto implementa patrones profesionales para garantizar consistencia, escalabilidad y mantenibilidad del código.

### 🏗️ Patrón Repository

#### BaseRepository
- **Ubicación**: `app/repositories/base_repository.py`
- **Propósito**: CRUD genérico reutilizable para todas las entidades
- **Características**:
  - Soporte para soft delete con `active_field`
  - Manejo automático de errores con `ValueError`

#### Implementación por entidad:
```python
class TuEntidadRepository(BaseRepository[TuEntidad]):
    def __init__(self, db: Session):
        # Con soft delete
        super().__init__(db, TuEntidad)  # default: active_field='activo'
        
        # Sin soft delete
        super().__init__(db, TuEntidad, active_field=None)
```

### 🛡️ Sistema de Manejo de Errores

#### Formato Estándar
**Todos los errores** devuelven el mismo formato JSON:
```json
{"detail": "mensaje descriptivo"}
```

#### Mapeo de Excepciones:
- **422**: Validaciones Pydantic (campos requeridos, tipos, etc.)
- **404**: Datos no encontrados (`ValueError` del Repository)
- **400**: Errores de lógica de negocio (`BusinessError` del Service)
- **409**: Conflictos de base de datos (registros duplicados)
- **500**: Errores internos (configuración, BD, etc.)

#### Ubicación:
- **Definiciones**: `app/core/exceptions/definitions.py`
- **Handlers**: `app/core/exceptions/error_handler.py`
- **Configuración**: `app/core/exceptions/exception_config.py`

### 📝 Validaciones por Capa

#### 1. Router (FastAPI + Pydantic)
- Validación automática de tipos, formatos, rangos
- Parámetros de URL con `Path(gt=0, description="...")`
- Esquemas de entrada con `Field()` validaciones

#### 2. Service (Lógica de negocio)
- Validación de reglas de negocio específicas
- Verificación de existencia de entidades relacionadas
- Uso de `BusinessError` para errores específicos

#### 3. Repository (Acceso a datos)
- Lanza `ValueError` cuando no encuentra registros
- Manejo automático de soft delete

### 💾 Patrón de Commits y Transacciones

Este proyecto usa una estrategia híbrida para commits de base de datos:

#### Operaciones Simples (CRUD básico de 1 tabla)
El **repository** hace el commit automáticamente:
```python
# Service
evento_creado = await self.evento_repository.create(evento_dict)
# El commit ya se ejecutó internamente
```

**Cuándo usar:**
- CREATE, UPDATE, DELETE de una sola entidad
- No requiere atomicidad con otras operaciones
- Ejemplos: crear evento, actualizar local, eliminar zona

#### Operaciones Complejas (Multi-tabla, transacciones atómicas)
El **service** controla el commit manualmente:
```python
# Service
try:
    # 1. UPDATE de zona (stock)
    result = await self.db.execute(
        update(Zona).where(...).values(...)
    )
    
    # 2. INSERT de entrada
    db_entrada = Entrada(...)
    self.db.add(db_entrada)
    
    # 3. Commit atómico de AMBAS operaciones
    await self.db.commit()
    
except Exception:
    await self.db.rollback()
    raise
```

**Cuándo usar:**
- Operaciones que afectan múltiples tablas
- Se requiere atomicidad (todo o nada)
- Ejemplos: crear entrada + actualizar stock, crear evento + zonas, usuario + cliente

#### Regla de Oro
- **¿Es CRUD simple de 1 entidad?** → Repository commitea
- **¿Requiere atomicidad entre múltiples operaciones?** → Service controla commit

#### Importante
Dentro de transacciones controladas por service, usar:
- `self.db.add()` para inserts
- `self.db.execute()` para updates/deletes
- NO usar `repository.create()` o `repository.update()` (commitean internamente)

### 🔄 ResponseHandler Genérico

#### Uso:
```python
# En el Service
return ResponseHandler.success_create(entidad_response, "Mensaje personalizado")
```

#### Formato de respuesta:
```json
{
  "success": true,
  "message": "Registro creado exitosamente",
  "data": {
    // Todos los campos de la entidad automáticamente
  }
}
```

---

## 🚀 Implementar Nueva Entidad

### 1. Model
```python
# app/models/tu_entidad.py
class TuEntidad(Base):
    __tablename__ = 'tu_tabla'
    id = Column(Integer, primary_key=True)
    # tus campos...
    activo = Column(Boolean, default=True)  # Si usa soft delete
```

### 2. Repository
```python
# app/repositories/tu_entidad_repository.py
class TuEntidadRepository(BaseRepository[TuEntidad]):
    def __init__(self, db: Session):
        super().__init__(db, TuEntidad)  # Con activo
        # O: super().__init__(db, TuEntidad, active_field=None)  # Sin activo
```

### 3. Schemas
```python
# app/schemas/tu_entidad.py
class TuEntidadRequest(BaseModel):
    campo1: str = Field(min_length=1, max_length=100)
    campo2: int = Field(gt=0)

class TuEntidadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    campo1: str
    campo2: int
    # todos tus campos...
```

### 4. Service
```python
# app/services/tu_entidad_service.py
# Copiar LocalService y cambiar nombres/tipos
```

### 5. Router
```python
# app/routers/tu_entidad.py
# Copiar local.py y cambiar nombres/tipos
```

### ✅ Resultado:
- **Manejo de errores automático** para todas las validaciones
- **CRUD completo** con 5 endpoints estándar
- **Formato de respuesta consistente**
- **Validaciones en las capas correctas**

---

## 💡 Consideraciones y Mejores Prácticas

### ⚠️ Importante:
1. **Validar existencia antes de operaciones** - Usar `exists()` optimizado
2. **Usar BusinessError en Services** - Para errores de lógica específica
3. **Mantener formato estándar** - Todos los errores con `{"detail": "..."}`

### 🎯 Recomendaciones:
- **Nombres descriptivos** en mensajes de error
- **Validaciones tempranas** con Pydantic en schemas
- **Logging contextual** (método, URL, IP) automático
- **Reutilizar patrones** establecidos para consistencia

### 🔧 Debugging:
- Revisar logs con formato: `STATUS - METHOD PATH | MESSAGE | IP`
- Verificar que `active_field` esté configurado correctamente
- Usar `/docs` para probar endpoints rápidamente