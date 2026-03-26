export interface Evento {
  id: number
  nombre: string
  descripcion: string
  fecha_hora_inicio: string
  estado: string
  motivo_cancelacion?: string | null
  categoria_evento_id: number
  local_id: number
  local_nombre: string | null
  icono: string | null
}

export interface EventoPagination {
  skip: number
  limit: number
  total: number
  hasNext: boolean
  hasPrev: boolean
  currentPage: number
  totalPages: number
}

export interface EventosDashboardResumen {
  totalEventos: number
  eventosPublicados: number
  ticketsVendidos: number
  ingresosEstimados: number
}

export interface ListarEventosResponse {
  success: boolean
  data?: Evento[]
  pagination?: EventoPagination
  detail?: string
}

export type EstadoEvento = "Borrador" | "Proximamente" | "Publicado" | "Finalizado" | "Cancelado"

export interface DialogState {
  open: boolean
  eventoId: number | null
  nombre: string | null
  accion: string | null
}

export type MotivoCancelacion = string
