# Plan de implementación: Notificaciones (recordatorio 2 días antes)

Resumen
- Objetivo inicial: implementar notificaciones automáticas por correo que se envían 2 días antes del inicio del evento para cada `entrada` comprada.
- Principio de diseño: durabilidad y trazabilidad usando la base de datos como fuente de verdad. Escalable para otras notificaciones (encuestas post-evento, cambios, cancelaciones, agradecimientos).
- Complemento actual (RF69): cuando un administrador modifica fecha, hora o información del evento (excepto cambios de local o cancelaciones) se envía un correo transaccional inmediato a todos los asistentes con entradas vigentes, detallando los campos alterados.

Fases (alto nivel)

## Fase 0 — Diseño y decisiones (entregable)
- Definir tabla `jobs_notificaciones` y sus columnas mínimas:
  - `id` BIGINT PK
  - `entrada_id` BIGINT FK
  - `cliente_id` BIGINT FK
  - `zona_id` BIGINT (opcional denormalizado)
  - `evento_id` BIGINT (opcional denormalizado)
  - `notify_at` TIMESTAMP NOT NULL (UTC)
  - `status` TINYINT UNSIGNED NOT NULL DEFAULT 0  -- 0=pending, 1=done
  - `attempts` SMALLINT DEFAULT 0
  - `last_error` TEXT NULL
  - `processed_at` TIMESTAMP NULL
  - `created_at` TIMESTAMP DEFAULT now()
- Índices recomendados: `INDEX (status, notify_at)`, `INDEX (entrada_id)`.
- Política de retención: conservar `done/failed` por 30 días por defecto; archivar o borrar periódicamente.
- Decisión sobre datos: guardar FKs (entrada_id, cliente_id, zona_id, evento_id). Denormalizar `zona_id`/`evento_id` es opcional pero recomendable para resiliencia y menos joins.
 - Decisión sobre datos: GUARDAR SOLO IDS (decisión final)
   - Guardaremos únicamente las referencias (FKs) y el calendario (`notify_at`) en la tabla `Notificaciones`.
   - No almacenaremos snapshots (email, nombre de evento, etc.). El worker realizará JOINs en tiempo de ejecución para obtener los datos actuales al momento de enviar la notificación.
   - Razonamiento: así siempre enviamos información actualizada si cambian la fecha, el nombre del evento o el correo del cliente. Evita datos "stale". Si se desea que la notificación siga una fecha anterior, la lógica de actualización del evento deberá actualizar `notify_at` en los jobs pendientes.
   - Columnas mínimas por crear (resumen): `entrada_id` (FK), `cliente_id` (FK), `zona_id` (FK opcional), `evento_id` (FK opcional), `notify_at`, `status`, `created_at`, `processed_at`.

Aceptación fase 0:
- Documento aprobado con esquema y nombres (esta planificación).

## Fase 1 — Persistencia y atómico al crear entradas
- Documentar la estructura de la tabla `jobs_notificaciones` (esta documentación servirá para que el DBA/operaciones la cree manualmente en la base de datos). NO se ejecutará ninguna migración desde el código en este repositorio.
- Modificar el flujo de creación de `entrada` para insertar un registro en `jobs_notificaciones` en la misma transacción (usar `flush()` para obtener id de `entrada` antes del commit). El equipo aplicará la tabla manualmente en la BD según la documentación.
- Caso bulk: crear N `jobs_notificaciones` en la misma tx tras flush.

Criterios de aceptación:
- Al crear una entrada, al confirmarse el commit existe el job correspondiente; si la creación falla, no hay job huérfano. La creación física de la tabla se realizará fuera del código por el equipo de base de datos siguiendo la especificación documentada.

Índices recomendados (declarar al crear la tabla)
- INDEX compuesto para lectura rápida del worker: `(status, notify_at)` — permite buscar filas pendientes por estado y rango temporal sin full scan.
- INDEX individual para joins/consultas por entidad: `INDEX (entrada_id)` — útil para consultas y borrados relacionados con una entrada.
- INDEX para consultas por cliente: `INDEX (cliente_id)` — facilita auditoría o búsquedas por usuario.
- INDEX opcional para limpieza/archivado: `INDEX (processed_at)` — ayuda a localizar filas `done` antiguas para eliminar/archivar.

Notas de particionado/retención
- Para cargas grandes, recomendar particionar por rango temporal (`notify_at` por mes) y borrar/archivar particiones completas para limpieza eficiente.
- Política sugerida de retención: conservar registros `done`/`failed` por 30 días; realizar borrado por batches (DELETE ... LIMIT 1000) o drop de partición si aplica.

## Fase 2 — Worker que procesa jobs (scheduler sin broker)
- Implementar un worker (proceso simple) que haga polling a la BD:
  - SELECT ... WHERE status = 0 AND notify_at <= NOW() ORDER BY notify_at LIMIT N FOR UPDATE SKIP LOCKED
  - UPDATE a `processing`/claim (o marcar directamente `status=1` tras envío)
  - Ejecutar envío de correo (reusar `send_email`) y actualizar `processed_at`, `status`, `attempts`, `last_error` si falla.
- Configurar batch size y poll interval (ej. 1–5s, batch 50).

Criterios de aceptación:
- Worker procesa jobs puntuales y marca `done`. Reintentos y logging funcionan.

## Fase 3 — Operationalización (dev + docker)
- Añadir servicio `worker` en `docker-compose.yml` para desarrollo.
- Pruebas e2e en staging (crear entrada, esperar o simular `notify_at` y verificar envío).
- Logs, métricas básicas (número pendientes, tasa de éxito/fallo).

## Fase 4 — Escalado y producción
- Opciones de despliegue:
  - Simple: ejecutar worker como servicio en la misma infra que backend (ECS task / systemd / Docker).
  - Avanzado: migrar a Celery+broker Redis para gran escala (cuando necesites decoupling, retries avanzados y visibilidad). En ese caso, usar la tabla `jobs_notificaciones` como fuente de verdad y/o encolar tareas con ETA.
- Si se adopta Celery: provisionar ElastiCache Redis dedicado para broker; mantener tabla en DB para reconciliación.

Criterios de aceptación:
- Deploys reproducibles; worker autocurativo (restart on failure) y alertas para colas largas.

## Fase 5 — Mantenimiento y limpieza
- Job programado (Cron/Kubernetes CronJob) que archiva o borra rows `done` > 30 días por batch (DELETE ... LIMIT 1000 o drop partition si se particiona).
- Métricas/alertas: pendiente count > umbral, error rate > X% por periodo.


Notas de diseño y por qué es escalable
- La tabla `jobs_notificaciones` es una cola durable: la BD es fuente de verdad — no pierdes jobs si el broker falla.
- Separar persistencia (DB) del executor (worker) permite evolucionar a Celery/RabbitMQ/Redis sin perder historial ni trazabilidad.
- Denormalizar `zona_id`/`evento_id` es un compromiso de espacio por velocidad y resiliencia: evita joins costosos o datos perdiéndose si la entidad cambia/borran.

Lista mínima de artefactos a crear (prioridad)
1. Documentación de la estructura de la tabla `jobs_notificaciones` para que sea creada manualmente en la BD (campo/índices/constraints).  
2. Modelo `JobNotificacion` en `app/models/`.  
3. Cambio en `entrada_service` para insertar job atómico.  
4. Worker DB-poller en `app/workers/` o `app/commands/`.  
5. Añadir servicio `worker` en `docker-compose.yml` (dev).  
6. Tests e2e y unitarios.

Próximos pasos recomendados (inmediatos)
- Implementar la migración y el modelo (Fase 1).  
- Modificar `entrada_service` para insertar job atómico y ejecutar pruebas locales con `docker-compose`.

---

Este plan cubre el requisito inmediato (recordatorio 2 días antes) y deja la puerta abierta para otros tipos de notificaciones (1 hora post-evento, cambios, cancelaciones) simplemente creando jobs con distintos `notify_at` o `notification_type`.

Si quieres, genero ahora la migración SQL y el esqueleto del modelo `JobNotificacion` (sin código ejecutable para el worker).