import { useState, useEffect, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react'
import { useEventos } from '@/lib/hooks/eventos'
import { useDebounce } from '@/lib/hooks/shared'
import type { Evento, EventoPagination, EventosDashboardResumen } from '@/lib/types/evento'
import { sortEventos, type SortConfig, type SortField, type PeriodoFilter } from '../utils/eventos-filters'

interface UseEventosAdminReturn {
  eventos: Evento[]
  filteredEventos: Evento[]
  pagination: EventoPagination
  loading: boolean
  error: string | null
  isInitialized: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterCategoria: string
  setFilterCategoria: (categoria: string) => void
  filterEstado: string
  setFilterEstado: (estado: string) => void
  filterPeriodo: PeriodoFilter
  setFilterPeriodo: (periodo: PeriodoFilter) => void
  sortConfig: SortConfig
  handleSort: (field: SortField) => void
  totalEventos: number
  eventosPublicados: number
  ticketsVendidos: number
  ingresosEstimados: number
  refetch: () => Promise<void>
  setEventos: Dispatch<SetStateAction<Evento[]>>
  handleClearFilters: () => void
  hasActiveFilters: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
}

export function useEventosAdmin(): UseEventosAdminReturn {
  const { listarEventos, obtenerDashboardResumen, loading, error } = useEventos()
  
  const [eventos, setEventos] = useState<Evento[]>([])
  const [pagination, setPagination] = useState<EventoPagination>({ 
    skip: 0,
    limit: 10,
    total: 0,
    hasNext: false,
    hasPrev: false,
    currentPage: 1,
    totalPages: 0
  })
  const [isInitialized, setIsInitialized] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterPeriodo, setFilterPeriodo] = useState<PeriodoFilter>('todos')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'fecha', order: 'asc' })
  const [dashboardResumen, setDashboardResumen] = useState<EventosDashboardResumen>({
    totalEventos: 0,
    eventosPublicados: 0,
    ticketsVendidos: 0,
    ingresosEstimados: 0
  })

  const fetchEventos = useCallback(async (skip: number = 0, limit: number = 10) => {
    const categoria_id = filterCategoria !== 'todos' ? parseInt(filterCategoria) : undefined
    const estado = filterEstado !== 'todos' ? filterEstado : undefined
    const periodo = filterPeriodo !== 'todos' ? filterPeriodo : undefined
    const busqueda = debouncedSearchTerm.trim() || undefined
    
    const result = await listarEventos({
      skip,
      limit,
      categoria_id,
      estado,
      periodo,
      busqueda
    })
    
    if (result.success && 'data' in result && result.data) {
      setEventos(result.data)
      if ('pagination' in result && result.pagination) {
        setPagination(result.pagination)
      }
    }
    
    if (!isInitialized) {
      setTimeout(() => {
        setIsInitialized(true)
      }, 100)
    }
  }, [listarEventos, filterCategoria, filterEstado, filterPeriodo, debouncedSearchTerm, isInitialized])

  const fetchDashboardResumen = useCallback(async () => {
    const result = await obtenerDashboardResumen()
    if (result.success) {
      setDashboardResumen(result.data)
    }
  }, [obtenerDashboardResumen])

  useEffect(() => {
    if (!isInitialized) {
      fetchDashboardResumen()
      fetchEventos()
    }
  }, [isInitialized, fetchEventos, fetchDashboardResumen])
  
  useEffect(() => {
    if (isInitialized) {
      fetchEventos(0, pagination.limit)
    }
  }, [filterCategoria, filterEstado, filterPeriodo, debouncedSearchTerm])

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const filteredEventos = useMemo(() => {
    return sortEventos(eventos, sortConfig)
  }, [eventos, sortConfig])

  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' || 
           filterCategoria !== 'todos' || 
           filterEstado !== 'todos' || 
           filterPeriodo !== 'todos'
  }, [searchTerm, filterCategoria, filterEstado, filterPeriodo])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setFilterCategoria('todos')
    setFilterEstado('todos')
    setFilterPeriodo('todos')
  }, [])

  const totalEventos = dashboardResumen.totalEventos
  const eventosPublicados = dashboardResumen.eventosPublicados
  const ticketsVendidos = dashboardResumen.ticketsVendidos
  const ingresosEstimados = dashboardResumen.ingresosEstimados

  // Funciones de paginación
  const goToPage = useCallback((page: number) => {
    const skip = (page - 1) * pagination.limit
    fetchEventos(skip, pagination.limit)
  }, [fetchEventos, pagination.limit])

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.currentPage + 1)
    }
  }, [goToPage, pagination.hasNext, pagination.currentPage])

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      goToPage(pagination.currentPage - 1)
    }
  }, [goToPage, pagination.hasPrev, pagination.currentPage])

  return {
    eventos,
    filteredEventos,
    pagination,
    loading,
    error,
    isInitialized,
    searchTerm,
    setSearchTerm,
    filterCategoria,
    setFilterCategoria,
    filterEstado,
    setFilterEstado,
    filterPeriodo,
    setFilterPeriodo,
    sortConfig,
    handleSort,
    totalEventos,
    eventosPublicados,
    ticketsVendidos,
    ingresosEstimados,
    refetch: fetchEventos,
    setEventos,
    handleClearFilters,
    hasActiveFilters,
    goToPage,
    nextPage,
    prevPage
  }
}
