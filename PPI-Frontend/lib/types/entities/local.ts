import type { ApiResult } from '@/lib/types/shared/api-responses'

export interface LocalRequest {
  nombre: string
  direccion: string
  distrito_id: number
  aforo: number
  tipo_local_id: number
  activo?: boolean
  // opcional: coordenadas si el frontend las provee
  latitud?: number | null
  longitud?: number | null
}

export interface LocalResponse {
  id: number
  distrito_id: number
  nombre: string
  direccion: string
  aforo: number
  tipo_local_id: number
  activo: boolean
  // coordenadas para mapa
  latitud?: number | null
  longitud?: number | null
  fecha_creacion?: string
  fecha_actualizacion?: string
}

export interface LocalResponseWithNames extends LocalResponse {
  distrito_nombre: string
  tipo_local_nombre: string
}

export interface LocalDisplay extends LocalResponse {
  distrito: string
  tipo: string
  capacidad: number
  estado: string
  eventos: number
  fechaRegistro: string
}

export interface LocalesImportInsertado {
  mensaje?: string
  message?: string
  fila?: number
  nombre?: string
  detalle?: string
}

export interface LocalesImportData {
  errores: string[]
  insertados: Array<string | LocalesImportInsertado>
}

export type LocalesImportResult = ApiResult<LocalesImportData>