# Explicación de Relaciones en el Modelo de Datos

## 📋 Resumen de Relaciones

### Modelo de Eventos, Zonas y Entradas

```
Administrador (1) ──────── (*) Evento
CategoriaEvento (1) ─────── (*) Evento
Local (1) ──────────────── (*) Evento
Evento (1) ────────────── (*) Zona
Zona (1) ──────────────── (*) Entrada
Cliente (1) ────────────── (*) Entrada
```

---

## 🔗 Tipos de Relaciones

### 1. Relaciones **1:N** (Uno a Muchos)

Estas son las relaciones donde **un** registro puede tener **muchos** registros relacionados.

#### **Local → Eventos**
- ✅ Un **local** puede tener **muchos eventos**
- ✅ Un **evento** pertenece a **un solo local**

```python
# En Local
eventos = relationship("Evento", back_populates="local")

# En Evento
local = relationship("Local", back_populates="eventos")
```

**Por qué NO usa `uselist=False`:** Porque un local SÍ puede tener una lista de eventos. El parámetro `uselist=False` se usa solo para relaciones 1:1.

---

#### **CategoriaEvento → Eventos**
- ✅ Una **categoría** puede tener **muchos eventos**
- ✅ Un **evento** pertenece a **una sola categoría**

```python
# En CategoriaEvento
eventos = relationship("Evento", back_populates="categoria_evento")

# En Evento
categoria_evento = relationship("CategoriaEvento", back_populates="eventos")
```

---

#### **Administrador → Eventos**
- ✅ Un **administrador** puede crear **muchos eventos**
- ✅ Un **evento** es creado por **un solo administrador**

```python
# En Administrador
eventos = relationship("Evento", back_populates="administrador")

# En Evento
administrador = relationship("Administrador", back_populates="eventos")
```

---

#### **Evento → Zonas**
- ✅ Un **evento** puede tener **muchas zonas** (VIP, General, Platea, etc.)
- ✅ Una **zona** pertenece a **un solo evento**

```python
# En Evento
zonas = relationship("Zona", back_populates="evento", cascade="all, delete-orphan")

# En Zona
evento = relationship("Evento", back_populates="zonas")
```

**Nota:** Aquí usé `cascade="all, delete-orphan"` para que si se elimina un evento, también se eliminen sus zonas automáticamente.

---

#### **Zona → Entradas**
- ✅ Una **zona** puede tener **muchas entradas**
- ✅ Una **entrada** pertenece a **una sola zona**

```python
# En Zona
entradas = relationship("Entrada", back_populates="zona", cascade="all, delete-orphan")

# En Entrada
zona = relationship("Zona", back_populates="entradas")
```

---

#### **Cliente → Entradas**
- ✅ Un **cliente** puede tener **muchas entradas** (compradas en diferentes eventos)
- ✅ Una **entrada** pertenece a **un solo cliente** (en un momento dado)

```python
# En Cliente
entradas = relationship("Entrada", back_populates="cliente")

# En Entrada
cliente = relationship("Cliente", back_populates="entradas")
```

---

### 2. Relaciones **1:1** (Uno a Uno)

Estas son relaciones donde **un** registro solo puede tener **un** registro relacionado.

#### **Usuario → Cliente**
- ✅ Un **usuario** puede ser **un cliente**
- ✅ Un **cliente** es **un usuario**

```python
# En Usuario
cliente = relationship("Cliente", back_populates="usuario", uselist=False)

# En Cliente
usuario = relationship("Usuario", back_populates="cliente", uselist=False)
```

**Por qué SÍ usa `uselist=False`:** Porque la relación es 1:1. Un usuario no tiene una "lista" de clientes, tiene máximo un registro de cliente.

---

#### **Usuario → Administrador**
- ✅ Un **usuario** puede ser **un administrador**
- ✅ Un **administrador** es **un usuario**

```python
# En Usuario
administrador = relationship("Administrador", back_populates="usuario", uselist=False)

# En Administrador
usuario = relationship("Usuario", back_populates="administrador", uselist=False)
```

---

## 🔧 Diferencias Clave

### `backref` vs `back_populates`

| Característica | `backref` | `back_populates` |
|---------------|-----------|------------------|
| Definición | Solo en un lado | En ambos lados |
| Explícito | No | Sí |
| Recomendado | No (legacy) | Sí |
| Claridad | Menos clara | Más clara |

**Ejemplo con `backref` (antigua forma):**
```python
# Solo se define en un lado
eventos = relationship("Evento", backref="local")
```

**Ejemplo con `back_populates` (forma moderna):**
```python
# Se define en ambos lados - MÁS CLARO
# En Local
eventos = relationship("Evento", back_populates="local")

# En Evento
local = relationship("Local", back_populates="eventos")
```

---

### `uselist=False` vs `uselist=True` (default)

| Parámetro | Cuándo usar | Resultado en Python |
|-----------|-------------|---------------------|
| `uselist=True` (default) | Relaciones 1:N | `objeto.relacion` devuelve una **lista** |
| `uselist=False` | Relaciones 1:1 | `objeto.relacion` devuelve **un objeto único** |

**Ejemplo:**
```python
# Relación 1:N (default)
local.eventos  # → [Evento1, Evento2, Evento3] (lista)

# Relación 1:1 (uselist=False)
usuario.cliente  # → Cliente (un objeto, no lista)
```

---

### `cascade="all, delete-orphan"`

Este parámetro define qué pasa cuando eliminas un registro padre:

```python
zonas = relationship("Zona", back_populates="evento", cascade="all, delete-orphan")
```

**Significa:**
- Si eliminas un `Evento`, se eliminan automáticamente todas sus `Zonas`
- Si eliminas una `Zona`, se eliminan automáticamente todas sus `Entradas`

**Por qué lo usé:**
- ✅ En `Evento → Zonas`: Las zonas no tienen sentido sin un evento
- ✅ En `Zona → Entradas`: Las entradas no tienen sentido sin una zona

**Por qué NO lo usé en otras relaciones:**
- ❌ En `Local → Eventos`: Si eliminas un local, NO deberías eliminar todos los eventos históricos
- ❌ En `Cliente → Entradas`: Si eliminas un cliente, NO deberías eliminar sus entradas (datos históricos)

---

## ✅ Validación del Modelo de Negocio

### Escenarios del Mundo Real

1. **Un local tiene muchos eventos** ✅
   - Ejemplo: "Estadio Nacional" puede tener conciertos, partidos, eventos culturales

2. **Un evento tiene muchas zonas** ✅
   - Ejemplo: Concierto de rock → VIP, Platea, General

3. **Una zona tiene muchas entradas** ✅
   - Ejemplo: Zona VIP con 100 entradas disponibles

4. **Un cliente compra muchas entradas** ✅
   - Ejemplo: Juan compra 2 entradas VIP + 3 entradas General

5. **Una entrada puede ser transferida** ✅
   - Campo `fue_transferida` permite rastrear transferencias
   - Campo `cliente_id` se actualiza al nuevo dueño

6. **Eventos nominales** ✅
   - Campo `es_nominal` en Evento
   - Campos `nombres_nominado`, `apellidos_nominado`, `numero_documento_nominado` en Entrada
   - Campo `estado_nominacion` (Pendiente/Valida/Invalida)

---

## 🎯 Optimización de Queries

Con estas relaciones puedes hacer queries eficientes:

```python
# Obtener todas las zonas de un evento
evento = session.query(Evento).filter_by(id=1).first()
zonas = evento.zonas  # Acceso directo por la relación

# Obtener todas las entradas de un cliente
cliente = session.query(Cliente).filter_by(id=1).first()
entradas = cliente.entradas  # Lista de entradas

# Obtener el evento de una entrada (navegación inversa)
entrada = session.query(Entrada).filter_by(id=1).first()
zona = entrada.zona
evento = entrada.zona.evento  # Navegación en cadena
```

---

## 📝 Conclusión

Las relaciones están configuradas de forma **óptima** para tu modelo de negocio:

✅ Usa `back_populates` (forma moderna y explícita)  
✅ Usa `uselist=False` solo para relaciones 1:1  
✅ Usa `cascade` apropiadamente para datos dependientes  
✅ Mantiene integridad referencial  
✅ Permite queries eficientes  
✅ Refleja correctamente el modelo de negocio  

