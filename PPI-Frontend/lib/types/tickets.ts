import type { EntradaClienteItem } from '@/lib/hooks/eventos/use-entradas-cliente'

export interface TicketZoneMeta {
  zoneId: number
  eventId: number
  zoneName: string
  precio?: number
}

export type TicketZoneMap = Record<number, TicketZoneMeta>

export interface TicketEventInfo {
  eventId: number
  name: string
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  localId?: number | null
  icon?: string | null
}

export type TicketEventMap = Record<number, TicketEventInfo>

export interface SelectedEntradaInfo extends EntradaClienteItem {
  eventoNombre: string
  zonaNombre: string
}

export interface TicketGroupedZone {
  id: number
  name: string
  count: number
  entries: EntradaClienteItem[]
}

export interface TicketGroupedEvent {
  eventId: number
  zones: Record<number, TicketGroupedZone>
}

export type TicketGroupedMap = Record<number, TicketGroupedEvent>

export interface TicketEndpointRequirement {
  endpoint: string
  expects: string | string[]
  usedFor: string
  response?: string | string[]
}

export interface TicketEndpointRequirementMap {
  entradasPorCliente: TicketEndpointRequirement
  zonasPorEvento?: TicketEndpointRequirement
  clientePorDni: TicketEndpointRequirement
  confirmarTransferencia: TicketEndpointRequirement
  historialTransferencias: TicketEndpointRequirement
  descargaQr: TicketEndpointRequirement
}
