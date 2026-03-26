import { EventoPublicResponse } from '@/lib/types/entities/evento'
import { EventosPublicosParams } from '@/lib/api/services/eventos'
import { PaginationMetadata } from '@/lib/types/shared/api-responses'

export interface CargarEventosResponse {
  success: boolean
  data?: EventoPublicResponse[]
  detail?: string
  cached?: boolean
}

export interface EventosState {
  eventos: EventoPublicResponse[]
  loading: boolean
  error: string | null
  initialized: boolean
  lastFetch: number | null
  filtros: EventosPublicosParams
  pagination: PaginationMetadata | null
  cargarEventos: (filtros?: EventosPublicosParams) => Promise<CargarEventosResponse>
  invalidateCache: () => void
  setError: (error: string | null) => void
  setFiltros: (filtros: EventosPublicosParams) => void
}

