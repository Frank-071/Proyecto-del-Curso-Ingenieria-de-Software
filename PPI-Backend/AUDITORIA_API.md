# API de Auditoría y Reportería

API REST para consultas de auditoría, métricas de negocio y reportería del sistema.

## 📋 Características

- ✅ Consultas directas a la base de datos (sin ORM para mejor performance)
- ✅ Filtros por evento, rango de fechas
- ✅ KPIs principales del negocio
- ✅ Tendencias mensuales
- ✅ Rankings (top eventos, usuarios, locales)
- ✅ Detalle de transacciones
- ✅ Distribución de ventas por evento
- ✅ Autenticación requerida (solo administradores)

## 🔗 Endpoints Disponibles

### Base URL
```
http://localhost:8000/auditoria
```

### 1. Dashboard Completo
```http
GET /auditoria/dashboard
```

**Descripción:** Obtiene todos los datos del dashboard en una sola llamada.

**Query Parameters:**
- `evento_id` (opcional): ID del evento específico
- `fecha_desde` (opcional): Fecha de inicio (ISO 8601). Default: hace 1 año
- `fecha_hasta` (opcional): Fecha de fin (ISO 8601). Default: hoy

**Headers requeridos:**
```
Authorization: Bearer <token>
```

**Ejemplo de request:**
```bash
curl -X GET "http://localhost:8000/auditoria/dashboard?fecha_desde=2025-01-01T00:00:00&fecha_hasta=2025-12-31T23:59:59" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Dashboard obtenido exitosamente",
  "data": {
    "kpis": {
      "ventas_totales": 150000.50,
      "ventas_estimadas": 180000.00,
      "tickets_emitidos": 2500,
      "tickets_transferidos": 150,
      "incidencias": 12,
      "tasa_conversion": 83.33
    },
    "datos_mensuales": [
      {
        "mes": "2025-01",
        "mes_nombre": "ene 2025",
        "ventas": 45000.00,
        "ventas_estimadas": 50000.00,
        "tickets": 600,
        "incidencias": 3
      }
    ],
    "top_eventos": [
      {
        "id": 1,
        "nombre": "Concierto de Rock",
        "ventas": 85000.00,
        "tickets": 1200
      }
    ],
    "top_usuarios": [
      {
        "id": 1,
        "nombre_completo": "Juan Pérez",
        "email": "juan@example.com",
        "total_compras": 5000.00,
        "cantidad_compras": 10
      }
    ],
    "top_locales": [
      {
        "id": 1,
        "nombre": "Estadio Nacional",
        "direccion": "Av. Principal 123",
        "total_ingresos": 120000.00,
        "cantidad_eventos": 5
      }
    ],
    "distribucion_eventos": [
      {
        "evento_id": 1,
        "evento_nombre": "Concierto de Rock",
        "total_ventas": 85000.00,
        "porcentaje": 56.67
      }
    ]
  }
}
```

---

### 2. KPIs Principales
```http
GET /auditoria/kpis
```

**Descripción:** Obtiene solo los indicadores clave de rendimiento.

**Query Parameters:**
- `evento_id` (opcional): ID del evento específico
- `fecha_desde` (opcional): Fecha de inicio
- `fecha_hasta` (opcional): Fecha de fin

**Ejemplo de request:**
```bash
curl -X GET "http://localhost:8000/auditoria/kpis?evento_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "KPIs obtenidos exitosamente",
  "data": {
    "ventas_totales": 150000.50,
    "ventas_estimadas": 180000.00,
    "tickets_emitidos": 2500,
    "tickets_transferidos": 150,
    "incidencias": 12,
    "tasa_conversion": 83.33
  }
}
```

---

### 3. Tendencias Mensuales
```http
GET /auditoria/tendencias
```

**Descripción:** Obtiene datos agregados por mes para gráficos de tendencia.

**Query Parameters:**
- `evento_id` (opcional): ID del evento específico
- `fecha_desde` (opcional): Fecha de inicio
- `fecha_hasta` (opcional): Fecha de fin

**Ejemplo de request:**
```bash
curl -X GET "http://localhost:8000/auditoria/tendencias" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Tendencias obtenidas exitosamente",
  "data": [
    {
      "mes": "2025-01",
      "mes_nombre": "ene 2025",
      "ventas": 45000.00,
      "ventas_estimadas": 50000.00,
      "tickets": 600,
      "incidencias": 3
    },
    {
      "mes": "2025-02",
      "mes_nombre": "feb 2025",
      "ventas": 52000.00,
      "ventas_estimadas": 60000.00,
      "tickets": 750,
      "incidencias": 5
    }
  ]
}
```

---

### 4. Rankings
```http
GET /auditoria/rankings
```

**Descripción:** Obtiene los top eventos, usuarios y locales.

**Query Parameters:**
- `fecha_desde` (opcional): Fecha de inicio
- `fecha_hasta` (opcional): Fecha de fin
- `limite` (opcional): Número de resultados (1-100). Default: 10

**Ejemplo de request:**
```bash
curl -X GET "http://localhost:8000/auditoria/rankings?limite=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Rankings obtenidos exitosamente",
  "data": {
    "top_eventos": [
      {
        "id": 1,
        "nombre": "Concierto de Rock",
        "ventas": 85000.00,
        "tickets": 1200
      }
    ],
    "top_usuarios": [
      {
        "id": 1,
        "nombre_completo": "Juan Pérez",
        "email": "juan@example.com",
        "total_compras": 5000.00,
        "cantidad_compras": 10
      }
    ],
    "top_locales": [
      {
        "id": 1,
        "nombre": "Estadio Nacional",
        "direccion": "Av. Principal 123",
        "total_ingresos": 120000.00,
        "cantidad_eventos": 5
      }
    ]
  }
}
```

---

### 5. Detalle de Transacciones
```http
GET /auditoria/detalle
```

**Descripción:** Obtiene el detalle completo de todas las transacciones.

**Query Parameters:**
- `evento_id` (opcional): ID del evento específico
- `fecha_desde` (opcional): Fecha de inicio
- `fecha_hasta` (opcional): Fecha de fin

**Ejemplo de request:**
```bash
curl -X GET "http://localhost:8000/auditoria/detalle?evento_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Detalle de transacciones obtenido exitosamente",
  "data": [
    {
      "pago_id": 1,
      "cliente_id": 5,
      "cliente_nombre": "Juan Pérez",
      "evento_id": 1,
      "evento_nombre": "Concierto de Rock",
      "fecha_transaccion": "2025-11-15T18:30:00",
      "total": 450.00,
      "metodo_pago": "Tarjeta",
      "cantidad_tickets": 3
    }
  ]
}
```

---

### 6. Health Check
```http
GET /auditoria/health
```

**Descripción:** Verifica el estado del servicio de auditoría.

**Ejemplo de request:**
```bash
curl -X GET "http://localhost:8000/auditoria/health"
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Servicio de auditoría funcionando correctamente",
  "data": {
    "status": "healthy"
  }
}
```

---

## 🔐 Autenticación

Todos los endpoints (excepto `/health`) requieren autenticación como administrador.

### Obtener token
```bash
# 1. Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'

# 2. Usar el token en las peticiones
curl -X GET "http://localhost:8000/auditoria/dashboard" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 Casos de Uso

### Caso 1: Obtener métricas del último mes
```bash
curl -X GET "http://localhost:8000/auditoria/kpis?fecha_desde=2025-10-24T00:00:00&fecha_hasta=2025-11-24T23:59:59" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Caso 2: Ver tendencias de un evento específico
```bash
curl -X GET "http://localhost:8000/auditoria/tendencias?evento_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Caso 3: Top 20 usuarios más compradores
```bash
curl -X GET "http://localhost:8000/auditoria/rankings?limite=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Caso 4: Todas las transacciones de noviembre
```bash
curl -X GET "http://localhost:8000/auditoria/detalle?fecha_desde=2025-11-01T00:00:00&fecha_hasta=2025-11-30T23:59:59" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ❌ Manejo de Errores

### Error 401 - No autenticado
```json
{
  "detail": "Not authenticated"
}
```

### Error 403 - No autorizado (no es admin)
```json
{
  "detail": "No tienes permisos para acceder a este recurso"
}
```

### Error 422 - Parámetros inválidos
```json
{
  "detail": [
    {
      "loc": ["query", "evento_id"],
      "msg": "ensure this value is greater than or equal to 1",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

### Error 500 - Error interno
```json
{
  "success": false,
  "message": "Error al obtener el dashboard: ...",
  "data": null
}
```

---

## 🎯 Integración con Frontend

### Ejemplo en TypeScript/Next.js

```typescript
// lib/api/auditoria.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    kpis: KPIDashboard;
    datos_mensuales: DatoMensual[];
    top_eventos: TopEvento[];
    top_usuarios: TopUsuario[];
    top_locales: TopLocal[];
    distribucion_eventos: DistribucionEvento[];
  };
}

export async function getDashboard(
  token: string,
  params?: {
    evento_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }
): Promise<DashboardResponse> {
  const queryParams = new URLSearchParams();
  if (params?.evento_id) queryParams.append('evento_id', params.evento_id.toString());
  if (params?.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
  if (params?.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);

  const response = await fetch(
    `${API_BASE_URL}/auditoria/dashboard?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Error al obtener el dashboard');
  }

  return response.json();
}
```

---

## 📈 Optimizaciones

Las consultas están optimizadas con:
- Uso de índices en las columnas más consultadas
- JOINs optimizados
- Filtros aplicados temprano en las consultas
- Uso de `COALESCE` para evitar valores nulos
- Agregaciones eficientes con `GROUP BY`

---

## 🧪 Testing

### Usando Swagger UI
1. Navega a: `http://localhost:8000/docs`
2. Haz clic en "Authorize" y pega tu token
3. Prueba los endpoints directamente

### Usando curl
```bash
# Exportar token
export TOKEN="your_access_token_here"

# Probar endpoints
curl -X GET "http://localhost:8000/auditoria/health"
curl -X GET "http://localhost:8000/auditoria/kpis" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:8000/auditoria/dashboard" -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Notas Adicionales

1. **Fechas**: Todas las fechas deben estar en formato ISO 8601 (`YYYY-MM-DDTHH:MM:SS`)
2. **Timezone**: Las fechas se almacenan en UTC
3. **Decimales**: Los montos usan precisión decimal (8,2)
4. **Paginación**: Actualmente no implementada en detalle de transacciones
5. **Cache**: No implementado (considerar para optimizaciones futuras)

---

## 🔄 Próximas Mejoras

- [ ] Paginación en detalle de transacciones
- [ ] Exportación a CSV/Excel
- [ ] Filtros adicionales (por local, categoría, etc.)
- [ ] Cache de resultados
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Gráficos generados en backend
