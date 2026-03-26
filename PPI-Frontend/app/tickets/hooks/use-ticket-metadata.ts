'use client'

import { useMemo } from 'react'
import type { EntradaClienteItem } from '@/lib/hooks/eventos/use-entradas-cliente'
import type { TicketEventMap, TicketGroupedMap, TicketZoneMap } from '@/lib/types/tickets'

interface UseTicketMetadataResult {
  zoneMap: TicketZoneMap
  eventMap: TicketEventMap
  grouped: TicketGroupedMap
}

export const useTicketMetadata = (entradas: EntradaClienteItem[]): UseTicketMetadataResult => {
  const zoneMap = useMemo<TicketZoneMap>(() => {
    const map: TicketZoneMap = {}
    entradas.forEach((entrada) => {
      const zona = entrada.zona
      if (!zona) return

      const eventId = zona.evento?.evento_id
      if (!eventId) return

      map[entrada.zona_id] = {
        zoneId: entrada.zona_id,
        eventId,
        zoneName: zona.nombre,
        precio: typeof zona.precio === 'number' ? zona.precio : Number(zona.precio ?? 0),
      }
    })
    return map
  }, [entradas])

  const eventMap = useMemo<TicketEventMap>(() => {
    const map: TicketEventMap = {}
    entradas.forEach((entrada) => {
      const evento = entrada.zona?.evento
      if (!evento) return

      const eventId = evento.evento_id
      if (!eventId || map[eventId]) return

      map[eventId] = {
        eventId,
        name: evento.nombre,
        startDate: evento.fecha_hora_inicio ?? null,
        endDate: evento.fecha_hora_fin ?? null,
        status: evento.estado ?? null,
        localId: evento.local_id ?? null,
        icon: evento.icono ?? null,
      }
    })
    return map
  }, [entradas])

  const grouped = useMemo<TicketGroupedMap>(() => {
    const map: TicketGroupedMap = {}
    entradas.forEach((entrada) => {
      const zonaMeta = zoneMap[entrada.zona_id]
      if (!zonaMeta) return

      const eventGroup = (map[zonaMeta.eventId] ||= {
        eventId: zonaMeta.eventId,
        zones: {},
      })

      const zoneGroup = (eventGroup.zones[zonaMeta.zoneId] ||= {
        id: zonaMeta.zoneId,
        name: zonaMeta.zoneName,
        count: 0,
        entries: [],
      })

      zoneGroup.count += 1
      zoneGroup.entries = [...zoneGroup.entries, entrada]
    })
    
    // Ordenar las entradas dentro de cada zona por fecha de creación (más recientes primero)
    Object.values(map).forEach((eventGroup) => {
      Object.values(eventGroup.zones).forEach((zoneGroup) => {
        zoneGroup.entries.sort((a, b) => {
          const fechaA = a.fecha_creacion || a.fecha_transaccion || ''
          const fechaB = b.fecha_creacion || b.fecha_transaccion || ''
          
          if (!fechaA && !fechaB) return 0
          if (!fechaA) return 1
          if (!fechaB) return -1
          
          return new Date(fechaB).getTime() - new Date(fechaA).getTime()
        })
      })
    })
    
    return map
  }, [entradas, zoneMap])

  return {
    zoneMap,
    eventMap,
    grouped,
  }
}
