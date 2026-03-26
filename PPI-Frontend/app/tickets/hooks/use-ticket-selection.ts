'use client'

import { useCallback, useMemo, useState } from 'react'
import type { EntradaClienteItem } from '@/lib/hooks/eventos/use-entradas-cliente'
import type { SelectedEntradaInfo, TicketEventMap, TicketZoneMap } from '@/lib/types/tickets'

interface UseTicketSelectionParams {
  entradas: EntradaClienteItem[]
  zoneMap: TicketZoneMap
  eventMap: TicketEventMap
}

interface UseTicketSelectionResult {
  selectedMap: Record<number, boolean>
  selectedIds: number[]
  selectedCount: number
  toggleEntrada: (entradaId: number, forceValue?: boolean) => void
  setEntradasSelection: (entradaIds: number[], checked: boolean) => void
  clearSelection: () => void
  isSelected: (entradaId: number) => boolean
  selectedEntradas: SelectedEntradaInfo[]
}

export const useTicketSelection = ({ entradas, zoneMap, eventMap }: UseTicketSelectionParams): UseTicketSelectionResult => {
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({})

  const toggleEntrada = useCallback((entradaId: number, forceValue?: boolean) => {
    setSelectedMap((prev) => {
      const current = !!prev[entradaId]
      const nextValue = typeof forceValue === 'boolean' ? forceValue : !current
      return {
        ...prev,
        [entradaId]: nextValue,
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedMap({})
  }, [])

  const setEntradasSelection = useCallback((entradaIds: number[], checked: boolean) => {
    if (!entradaIds.length) {
      return
    }
    setSelectedMap((prev) => {
      const next = { ...prev }
      entradaIds.forEach((entradaId) => {
        if (checked) {
          next[entradaId] = true
        } else {
          delete next[entradaId]
        }
      })
      return next
    })
  }, [])

  const isSelected = useCallback((entradaId: number) => !!selectedMap[entradaId], [selectedMap])

  const selectedIds = useMemo(() => Object.keys(selectedMap).filter((id) => selectedMap[Number(id)]).map((id) => Number(id)), [selectedMap])

  const selectedEntradas = useMemo<SelectedEntradaInfo[]>(() => {
    return entradas
      .filter((entrada) => selectedIds.includes(entrada.id))
      .map((entrada) => {
        const meta = zoneMap[entrada.zona_id]
        const event = meta ? eventMap[meta.eventId] : undefined
        return {
          ...entrada,
          eventoNombre: event?.name || 'Evento',
          zonaNombre: meta?.zoneName || 'Zona',
        }
      })
  }, [entradas, selectedIds, zoneMap, eventMap])

  return {
    selectedMap,
    selectedIds,
    selectedCount: selectedIds.length,
    toggleEntrada,
    setEntradasSelection,
    clearSelection,
    isSelected,
    selectedEntradas,
  }
}
