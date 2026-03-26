import type { PaginationMetadata } from "@/lib/types/shared/api-responses"

export type LogTipoError =
  | "DATABASE"
  | "API"
  | "VALIDATION"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "SYSTEM"

export type LogModuloSistema =
  | "EVENTOS"
  | "ZONAS"
  | "LOCALES"
  | "USUARIOS"
  | "ENTRADAS"
  | "PAGOS"
  | "SISTEMA"

export interface LogErrorItem {
  log_id: number
  usuario_id: number | null
  tipo_error: LogTipoError
  modulo: LogModuloSistema
  descripcion_tecnica: string
  timestamp: string
  detalles_adicionales?: Record<string, unknown> | null
  usuario_email?: string | null
  usuario_nombres?: string | null
}

export interface LogErrorFilters {
  skip?: number
  limit?: number
  tipo_error?: LogTipoError
  modulo?: LogModuloSistema
  fecha_desde?: string
  fecha_hasta?: string
  usuario_id?: number
  busqueda?: string
}

export interface LogErrorListResponse {
  success: boolean
  message: string
  data: LogErrorItem[]
  pagination: PaginationMetadata
}

export type LogExportFormat = "csv" | "xlsx"

export interface LogExportParams extends Omit<LogErrorFilters, "skip" | "limit"> {
  formato?: LogExportFormat
  max_registros?: number
}

export interface LogExportResult {
  blob: Blob
  filename: string
  mediaType: string
}
