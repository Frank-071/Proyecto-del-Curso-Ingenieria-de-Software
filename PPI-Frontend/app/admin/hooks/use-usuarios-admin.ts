import { useState, useEffect, useMemo, useCallback } from 'react'
import { useUsuarios } from '@/lib/hooks/usuarios'
import { useDebounce } from '@/lib/hooks/shared'
import { sortUsuarios, type SortConfig, type SortField } from '../utils/usuarios-filters'
import type { UsuarioDisplay } from '@/lib/types/entities/usuario'
import type { PaginationMetadata } from '@/lib/types/shared/api-responses'

export interface UseUsuariosAdminReturn {
    usuarios: UsuarioDisplay[]
    filteredUsuarios: UsuarioDisplay[]
    pagination: PaginationMetadata
    loading: boolean
    error: string | null
    isInitialized: boolean

    searchTerm: string
    setSearchTerm: (term: string) => void

    filterEstado: string
    setFilterEstado: (value: string) => void

    sortConfig: SortConfig
    handleSort: (field: SortField) => void

    refetch: () => Promise<void>
    handleClearFilters: () => void
    hasActiveFilters: boolean

    goToPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void

    toggleUsuarioStatus: (id: number, activar: boolean) => Promise<{ success: boolean; error: string | null }>
    setError: (error: string | null) => void
}

export function useUsuariosAdmin(): UseUsuariosAdminReturn {
    const {
        usuarios,
        loading,
        error,
        isInitialized,
        pagination,
        fetchUsuarios,
        toggleUsuarioStatus,
        setError
    } = useUsuarios()

    
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    
    const [filterEstado, setFilterEstado] = useState('todos') 

    
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        field: 'nombre',
        order: 'asc'
    })

    
    useEffect(() => {
        if (!isInitialized) return

        const activo =
            filterEstado === 'Activo' ? true :
            filterEstado === 'Inactivo' ? false :
            undefined

        fetchUsuarios({
            skip: 0,
            limit: pagination.limit,
            activo,
            busqueda: debouncedSearchTerm.trim() || undefined
        })
    }, [filterEstado, debouncedSearchTerm, isInitialized, pagination.limit, fetchUsuarios])

    
    const handleSort = useCallback((field: SortField) => {
        setSortConfig(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }))
    }, [])

    const filteredUsuarios = useMemo(() => {
        return sortUsuarios(usuarios, sortConfig)
    }, [usuarios, sortConfig])

   
    const hasActiveFilters = useMemo(() => {
        return searchTerm.trim() !== '' ||
            filterEstado !== 'todos'
    }, [searchTerm, filterEstado])

    
    const handleClearFilters = useCallback(() => {
        setSearchTerm('')
        setFilterEstado('todos')
    }, [])

    
    const refetch = useCallback(async () => {
        await fetchUsuarios({
            skip: 0,
            limit: pagination.limit
        })
    }, [fetchUsuarios, pagination.limit])

    
    const goToPageWithFilters = useCallback((page: number) => {
        const skip = (page - 1) * pagination.limit
        const activo =
            filterEstado === 'Activo' ? true :
            filterEstado === 'Inactivo' ? false :
            undefined

        fetchUsuarios({
            skip,
            limit: pagination.limit,
            activo,
            busqueda: debouncedSearchTerm.trim() || undefined
        })
    }, [filterEstado, debouncedSearchTerm, pagination.limit, fetchUsuarios])

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
        usuarios,
        filteredUsuarios,
        pagination,
        loading,
        error,
        isInitialized,

        searchTerm,
        setSearchTerm,

        filterEstado,
        setFilterEstado,

        sortConfig,
        handleSort,

        refetch,
        handleClearFilters,
        hasActiveFilters,

        goToPage: goToPageWithFilters,
        nextPage: nextPageWithFilters,
        prevPage: prevPageWithFilters,

        toggleUsuarioStatus,
        setError
    }
}
