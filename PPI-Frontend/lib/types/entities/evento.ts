export interface EventoRequest {
  local_id: number
  organizador_id: number
  categoria_evento_id: number
  administrador_id: number
  nombre: string
  descripcion: string
  fecha_hora_inicio: string
  fecha_hora_fin: string
  es_nominal: boolean
  estado: string
  imagen?: string // Base64 string
}

export interface EventoResponse {
  evento_id?: number // Para compatibilidad con diferentes endpoints
  id?: number // Algunos endpoints usan 'id' en lugar de 'evento_id'
  nombre: string
  descripcion: string
  fecha_hora_inicio: string
  fecha_hora_fin: string
  es_nominal: boolean
  estado: string
  motivo_cancelacion?: string | null
  icono_url?: string
  icono?: string // Alias para compatibilidad
  mapa_url?: string
  mapa?: string // Alias para compatibilidad
  local_id: number
  organizador_id: number
  categoria_evento_id: number
  fecha_creacion?: string
  // Campos relacionados que pueden venir expandidos (dependiendo del endpoint)
  local?: {
    local_id?: number
    id?: number // Algunos endpoints usan 'id'
    nombre: string
    direccion?: string
    distrito_id: number
    distrito?: {
      distrito_id?: number
      id?: number
      nombre: string
      provincia_id: number
      provincia?: {
        provincia_id?: number
        id?: number
        nombre: string
        departamento_id: number
        departamento?: {
          departamento_id?: number
          id?: number
          nombre: string
        }
      }
    }
  }
  organizador?: {
    organizador_id?: number
    id?: number
    nombre: string
    descripcion?: string
  }
  categoria_evento?: {
    categoria_evento_id?: number
    id?: number
    nombre: string
    descripcion?: string
  }
  zonas?: ZonaEventoResponse[]
}

export interface ZonaEventoResponse {
  id: number
  nombre: string
  descripcion: string
  precio: number
  stock_entradas: number
}

export interface EventoPublicResponse {
  id?: number
  evento_id?: number
  nombre: string
  descripcion: string
  fecha_hora_inicio: string
  fecha_hora_fin: string
  es_nominal: boolean
  motivo_cancelacion?: string | null
  estado?: string
  icono?: string
  local_nombre: string
  local_direccion?: string
  categoria_nombre?: string
}

export interface EventosListResponse {
  data: EventoResponse[]
  pagination: {
    total: number
    page: number
    pages: number
    per_page: number
  }
}

export interface EventosPublicListResponse {
  data: EventoPublicResponse[]
  pagination: {
    total: number
    page: number
    pages: number
    per_page: number
  }
}