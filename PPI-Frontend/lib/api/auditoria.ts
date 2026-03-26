// lib/api/auditoria.ts
// API Client para consumir los endpoints de auditoría

import { tokenUtils } from '@/lib/auth/token';
import type {
  LogErrorFilters,
  LogErrorListResponse,
  LogExportFormat,
  LogExportParams,
  LogExportResult,
} from '@/lib/types/auditoria/logs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUDITORIA_BASE_URL = `${API_BASE_URL}/auditoria`;

/**
 * Interfaces para los tipos de datos retornados por la API
 */

export interface KPIDashboard {
  ventas_totales: number;
  ventas_estimadas: number;
  tickets_emitidos: number;
  tickets_transferidos: number;
  incidencias: number;
  tasa_conversion: number;
  aforo_vendido: number;
  velocidad_venta: number;
}

export interface DatoMensual {
  mes: string;
  mes_nombre: string;
  ventas: number;
  ventas_estimadas: number;
  tickets: number;
  incidencias: number;
}

export interface TopEvento {
  id: number;
  nombre: string;
  ventas: number;
  tickets: number;
}

export interface TopUsuario {
  id: number;
  nombre_completo: string;
  email: string;
  total_compras: number;
  cantidad_compras: number;
  rango_nombre: string;
  puntos_disponibles: number;
}

export interface TopLocal {
  id: number;
  nombre: string;
  direccion: string;
  total_ingresos: number;
  cantidad_eventos: number;
}

export interface DistribucionCategoria {
  categoria_id: number;
  categoria_nombre: string;
  total_ventas: number;
  cantidad_eventos: number;
  porcentaje: number;
}

export interface DetalleTransaccion {
  pago_id: number;
  cliente_id: number;
  cliente_nombre: string;
  evento_id: number;
  evento_nombre: string;
  fecha_transaccion: string;
  total: number;
  metodo_pago: string;
  cantidad_tickets: number;
}

export interface DashboardCompleto {
  kpis: KPIDashboard;
  datos_mensuales: DatoMensual[];
  top_eventos: TopEvento[];
  top_usuarios: TopUsuario[];
  top_locales: TopLocal[];
  distribucion_categorias: DistribucionCategoria[];
}

export interface DatosExportacion {
  kpis: KPIDashboard;
  datos_mensuales: DatoMensual[];
  eventos: TopEvento[];
  usuarios: TopUsuario[];
  locales: TopLocal[];
  categorias: DistribucionCategoria[];
  transacciones: DetalleTransaccion[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Parámetros de filtro opcionales
 */
export interface FiltrosReporteria {
  evento_id?: number;
  fecha_desde?: string; // ISO 8601 format
  fecha_hasta?: string; // ISO 8601 format
  limite?: number;
}

/**
 * Función helper para hacer requests a la API
 */
async function apiRequest<T>(
  endpoint: string,
  params?: FiltrosReporteria
): Promise<ApiResponse<T>> {
  const token = await tokenUtils.getToken();
  
  if (!token) {
    throw new Error('No se encontró token de autenticación');
  }

  // Construir query params
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const url = `${AUDITORIA_BASE_URL}/${endpoint}${
    queryParams.toString() ? `?${queryParams}` : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    cache: 'no-store', // Siempre obtener datos frescos
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado. Por favor inicia sesión nuevamente.');
    }
    if (response.status === 403) {
      throw new Error('No tienes permisos para acceder a este recurso.');
    }
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * API Functions
 */

/**
 * Obtiene todos los datos del dashboard en una sola llamada
 */
export async function getDashboardCompleto(
  filtros?: FiltrosReporteria
): Promise<ApiResponse<DashboardCompleto>> {
  return apiRequest<DashboardCompleto>('dashboard', filtros);
}

/**
 * Obtiene solo los KPIs principales
 */
export async function getKPIs(
  filtros?: FiltrosReporteria
): Promise<ApiResponse<KPIDashboard>> {
  return apiRequest<KPIDashboard>('kpis', filtros);
}

/**
 * Obtiene datos mensuales para gráficos de tendencia
 */
export async function getTendencias(
  filtros?: FiltrosReporteria
): Promise<ApiResponse<DatoMensual[]>> {
  return apiRequest<DatoMensual[]>('tendencias', filtros);
}

/**
 * Obtiene los rankings (top eventos, usuarios y locales)
 */
export async function getRankings(
  filtros?: Omit<FiltrosReporteria, 'evento_id'>
): Promise<ApiResponse<{
  top_eventos: TopEvento[];
  top_usuarios: TopUsuario[];
  top_locales: TopLocal[];
}>> {
  return apiRequest('rankings', filtros);
}

/**
 * Obtiene el detalle de transacciones
 */
export async function getDetalleTransacciones(
  filtros?: FiltrosReporteria
): Promise<ApiResponse<DetalleTransaccion[]>> {
  return apiRequest('detalle', filtros);
}

/**
 * Obtiene TODOS los datos para exportación a Excel (sin límites)
 */
export async function getDatosExportacion(
  filtros?: FiltrosReporteria
): Promise<ApiResponse<DatosExportacion>> {
  return apiRequest<DatosExportacion>('exportar', filtros);
}

/**
 * Health check del servicio
 */
export async function healthCheck(): Promise<ApiResponse<{ status: string }>> {
  const response = await fetch(`${AUDITORIA_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Servicio de auditoría no disponible');
  }

  return response.json();
}

/**
 * Formatea una fecha a ISO 8601 para la API
 */
export function formatearFechaParaAPI(fecha: Date): string {
  return fecha.toISOString();
}

/**
 * Obtiene el rango de fechas de los últimos N meses
 */
export function obtenerRangoUltimosMeses(meses: number): {
  fecha_desde: string;
  fecha_hasta: string;
} {
  const fecha_hasta = new Date();
  const fecha_desde = new Date();
  
  if (meses === 1) {
    // Para "último mes", usar desde el día 1 del mes actual
    fecha_desde.setDate(1);
    fecha_desde.setHours(0, 0, 0, 0);
  } else {
    // Para múltiples meses, restar N meses completos
    fecha_desde.setMonth(fecha_desde.getMonth() - meses + 1);
    fecha_desde.setDate(1);
    fecha_desde.setHours(0, 0, 0, 0);
  }

  return {
    fecha_desde: formatearFechaParaAPI(fecha_desde),
    fecha_hasta: formatearFechaParaAPI(fecha_hasta),
  };
}

const buildQueryString = (params?: Record<string, string | number | undefined | null>) => {
  const query = new URLSearchParams();
  if (!params) {
    return '';
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.append(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const ensureBrowserToken = async () => {
  if (typeof window === 'undefined') {
    throw new Error('La consulta de logs solo está disponible desde el cliente');
  }

  const token = await tokenUtils.getToken();
  if (!token) {
    throw new Error('Sesión no válida. Inicia sesión nuevamente.');
  }
  return token;
};

export async function getLogErrors(
  filtros: LogErrorFilters
): Promise<LogErrorListResponse> {
  const token = await ensureBrowserToken();
  const queryString = buildQueryString(filtros as Record<string, string | number | undefined>);

  const response = await fetch(`${AUDITORIA_BASE_URL}/logs${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorPayload.detail || 'No se pudieron obtener los logs');
  }

  return response.json() as Promise<LogErrorListResponse>;
}

const extractFilename = (header: string | null, fallback: string) => {
  if (!header) {
    return fallback;
  }

  const match = header.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/i);
  if (match) {
    return decodeURIComponent(match[1] || match[2]);
  }
  return fallback;
};

export async function exportLogErrors(
  filtros: LogExportParams
): Promise<LogExportResult> {
  const token = await ensureBrowserToken();
  const queryString = buildQueryString(filtros as Record<string, string | number | undefined>);

  const response = await fetch(`${AUDITORIA_BASE_URL}/logs/export${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorPayload.detail || 'No se pudo exportar el archivo');
  }

  const blob = await response.blob();
  const mediaType = response.headers.get('content-type') || 'application/octet-stream';
  const fallbackName = `logs-errores.${(filtros.formato || 'csv') as LogExportFormat}`;
  const filename = extractFilename(response.headers.get('content-disposition'), fallbackName);

  return { blob, filename, mediaType };
}