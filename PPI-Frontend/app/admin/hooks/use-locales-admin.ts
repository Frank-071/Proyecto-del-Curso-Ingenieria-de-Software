import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocales } from '@/lib/hooks/locales'
import { useDebounce } from '@/lib/hooks/shared'
import { sortLocales, type SortConfig, type SortField } from '../utils/locales-filters'
import type { LocalDisplay } from '@/lib/types/entities/local'
import type { PaginationMetadata } from '@/lib/types/shared/api-responses'

export interface UseLocalesAdminReturn {
  locales: LocalDisplay[]
  filteredLocales: LocalDisplay[]
  pagination: PaginationMetadata
  loading: boolean
  error: string | null
  isInitialized: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterTipo: string
  setFilterTipo: (tipo: string) => void
  filterEstado: string
  setFilterEstado: (estado: string) => void
  filterDistrito: string
  setFilterDistrito: (distrito: string) => void
  sortConfig: SortConfig
  handleSort: (field: SortField) => void
  refetch: () => Promise<void>
  handleClearFilters: () => void
  hasActiveFilters: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  toggleLocalStatus: (id: number, activar: boolean) => Promise<{ success: boolean; error: string | null }>
  setError: (error: string | null) => void
}

export function useLocalesAdmin(): UseLocalesAdminReturn {
  const {
    locales,
    loading,
    error,
    isInitialized,
    pagination,
    fetchLocales,
    goToPage,
    nextPage,
    prevPage,
    toggleLocalStatus,
    setError
  } = useLocales()

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterDistrito, setFilterDistrito] = useState('todos')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'nombre', order: 'asc' })

  useEffect(() => {
    if (isInitialized) {
      const tipo_local_id = filterTipo !== 'todos' ? parseInt(filterTipo) : undefined
      const activo = filterEstado === 'Activo' ? true : filterEstado === 'Inactivo' ? false : undefined
      const distrito_id = filterDistrito !== 'todos' ? parseInt(filterDistrito) : undefined
      const busqueda = debouncedSearchTerm.trim() || undefined

      fetchLocales({
        skip: 0,
        limit: pagination.limit,
        tipo_local_id,
        activo,
        distrito_id,
        busqueda
      })
    }
  }, [filterTipo, filterEstado, filterDistrito, debouncedSearchTerm, isInitialized, pagination.limit])

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const filteredLocales = useMemo(() => {
    return sortLocales(locales, sortConfig)
  }, [locales, sortConfig])

  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' ||
           filterTipo !== 'todos' ||
           filterEstado !== 'todos' ||
           filterDistrito !== 'todos'
  }, [searchTerm, filterTipo, filterEstado, filterDistrito])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setFilterTipo('todos')
    setFilterEstado('todos')
    setFilterDistrito('todos')
  }, [])

  const refetch = useCallback(async () => {
    await fetchLocales({
      skip: 0,
      limit: pagination.limit
    })
  }, [fetchLocales, pagination.limit])

  // Sobrescribir goToPage, nextPage y prevPage para preservar los filtros
  const goToPageWithFilters = useCallback((page: number) => {
    const tipo_local_id = filterTipo !== 'todos' ? parseInt(filterTipo) : undefined
    const activo = filterEstado === 'Activo' ? true : filterEstado === 'Inactivo' ? false : undefined
    const distrito_id = filterDistrito !== 'todos' ? parseInt(filterDistrito) : undefined
    const busqueda = debouncedSearchTerm.trim() || undefined
    const skip = (page - 1) * pagination.limit

    fetchLocales({
      skip,
      limit: pagination.limit,
      tipo_local_id,
      activo,
      distrito_id,
      busqueda
    })
  }, [filterTipo, filterEstado, filterDistrito, debouncedSearchTerm, pagination.limit, fetchLocales])

  const nextPageWithFilters = useCallback(() => {
    if (pagination.hasNext) {
      goToPageWithFilters(pagination.currentPage + 1)
    }
  }, [pagination.hasNext, pagination.currentPage, goToPageWithFilters])

  const prevPageWithFilters = useCallback(() => {
    if (pagination.hasPrev) {
      goToPageWithFilters(pagination.currentPage - 1)
    }
  }, [pagination.hasPrev, pagination.currentPage, goToPageWithFilters])

  return {
    locales,
    filteredLocales,
    pagination,
    loading,
    error,
    isInitialized,
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    filterDistrito,
    setFilterDistrito,
    sortConfig,
    handleSort,
    refetch,
    handleClearFilters,
    hasActiveFilters,
    goToPage: goToPageWithFilters,
    nextPage: nextPageWithFilters,
    prevPage: prevPageWithFilters,
    toggleLocalStatus,
    setError
  }
}

