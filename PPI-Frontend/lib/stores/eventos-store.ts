"use client"

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { eventosService, EventosPublicosParams } from '@/lib/api/services/eventos'
import { EventosState } from '@/lib/types/stores/eventos'
import { EventoPublicResponse } from '@/lib/types/entities/evento'
import type { PaginationMetadata } from '@/lib/types/shared/api-responses'

const CACHE_TTL_MS = 4 * 60 * 1000

// Utilidad para comparar filtros de manera eficiente
function filtrosIguales(filtros1: EventosPublicosParams, filtros2: EventosPublicosParams): boolean {
  return (
    filtros1.categoria_id === filtros2.categoria_id &&
    filtros1.distrito_id === filtros2.distrito_id &&
    filtros1.fecha_inicio === filtros2.fecha_inicio &&
    filtros1.busqueda === filtros2.busqueda &&
    filtros1.skip === filtros2.skip &&
    filtros1.limit === filtros2.limit
  )
}

export const useEventosStore = create<EventosState>()(
  devtools(
    (set, get) => ({
      eventos: [],
      loading: false,
      error: null,
      initialized: false,
      lastFetch: null,
      filtros: { skip: 0, limit: 12 },
      pagination: null,

      setFiltros: (filtros: EventosPublicosParams) => {
        set({ filtros, lastFetch: null })
      },

      cargarEventos: async (filtros?: EventosPublicosParams) => {
        const state = get()
        const filtrosActuales = filtros || state.filtros

        if (state.loading) {
          return { success: true, data: state.eventos, cached: true }
        }

        // Comparar filtros de manera eficiente
        const filtrosCambiaron = !filtrosIguales(filtrosActuales, state.filtros)

        // Si los filtros cambiaron, invalidar cache y actualizar filtros
        if (filtrosCambiaron) {
          set({ lastFetch: null, filtros: filtrosActuales })
        }

        // Check cache solo si los filtros NO cambiaron
        if (state.initialized && state.lastFetch && !filtrosCambiaron) {
          const cacheAge = Date.now() - state.lastFetch
          if (cacheAge < CACHE_TTL_MS) {
            return { success: true, data: state.eventos, cached: true }
          }
        }

        set({ loading: true, error: null })

        try {
          const response = await eventosService.listarPublicos(filtrosActuales)

          if (response.success && 'data' in response && response.data) {
            const eventosData = response.data as EventoPublicResponse[]

            const skip = filtrosActuales.skip ?? 0
            const limit = filtrosActuales.limit ?? (eventosData.length || 1)
            const responsePagination = response.pagination as PaginationMetadata | undefined

            const fallbackCurrentPage = Math.floor(skip / limit) + 1
            const guessedHasNext = eventosData.length === limit
            const fallbackTotal = guessedHasNext ? skip + eventosData.length + 1 : skip + eventosData.length
            const fallbackTotalPages = guessedHasNext ? fallbackCurrentPage + 1 : fallbackCurrentPage

            const paginationMetadata: PaginationMetadata = responsePagination
              ? responsePagination
              : {
                  skip,
                  limit,
                  total: fallbackTotal,
                  hasNext: guessedHasNext,
                  hasPrev: skip > 0,
                  currentPage: fallbackCurrentPage,
                  totalPages: Math.max(1, fallbackTotalPages)
                }

            set({
              eventos: eventosData,
              loading: false,
              initialized: true,
              lastFetch: Date.now(),
              error: null,
              filtros: filtrosActuales,
              pagination: paginationMetadata
            })

            return { success: true, data: eventosData, cached: false }
          } else {
            // Type narrowing: si success es false, entonces tiene detail
            const errorDetail = !response.success ? response.detail : 'Error al cargar eventos'
            throw new Error(errorDetail)
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar eventos'
          set({
            error: errorMessage,
            loading: false,
            initialized: true,
            pagination: null
          })

          return { success: false, detail: errorMessage }
        }
      },

      invalidateCache: () => {
        set({ lastFetch: null, initialized: false, pagination: null })
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'eventos-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

export const useEventos = () => useEventosStore(state => state.eventos)
export const useEventosLoading = () => useEventosStore(state => state.loading)
export const useEventosError = () => useEventosStore(state => state.error)
export const useEventosInitialized = () => useEventosStore(state => state.initialized)
export const useCargarEventos = () => useEventosStore(state => state.cargarEventos)
export const useInvalidateEventosCache = () => useEventosStore(state => state.invalidateCache)

export function useEventosPublicos() {
  const eventos = useEventosStore(state => state.eventos)
  const loading = useEventosStore(state => state.loading)
  const error = useEventosStore(state => state.error)
  const initialized = useEventosStore(state => state.initialized)
  const cargarEventos = useEventosStore(state => state.cargarEventos)
  const invalidateCache = useEventosStore(state => state.invalidateCache)
  const setError = useEventosStore(state => state.setError)
  const filtros = useEventosStore(state => state.filtros)
  const setFiltros = useEventosStore(state => state.setFiltros)
  const pagination = useEventosStore(state => state.pagination)

  return {
    eventos,
    loading,
    error,
    initialized,
    cargarEventos,
    invalidateCache,
    setError,
    filtros,
    setFiltros,
    pagination
  }
}

