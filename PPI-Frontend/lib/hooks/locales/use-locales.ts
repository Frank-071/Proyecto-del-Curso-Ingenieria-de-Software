import { useState, useEffect, useCallback, useRef } from 'react'
import { localesService, type LocalesListarParams } from '@/lib/api/services/locales'
import { LocalDisplay, LocalRequest, LocalResponseWithNames } from '@/lib/types/entities/local'
import type { PaginationMetadata } from '@/lib/types/shared/api-responses'

// Interfaz de "Contrato" para la salida del hook
export interface UseLocalesReturn {
  locales: LocalDisplay[] // <-- Arregla el error de 'filteredLocales'
  loading: boolean
  error: string | null
  isInitialized: boolean
  pagination: PaginationMetadata // <-- Arregla el error de paginación

  // Funciones (asegúrate que coincidan con tu 'return' final)
  fetchLocales: (params?: LocalesListarParams) => Promise<void>
  fetchLocalById: (id: number) => Promise<LocalResponseWithNames | null>
  crearLocal: (localData: LocalRequest) => Promise<any>
  actualizarLocal: (id: number, localData: LocalRequest) => Promise<any>
  eliminarLocal: (id: number) => Promise<boolean>
  deleteLocal: (id: number) => Promise<boolean>
  toggleLocalStatus: (id: number, activar: boolean) => Promise<{ success: boolean; error: string | null }>
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setError: (error: string | null) => void
}

export const useLocales = () : UseLocalesReturn => {
  const [locales, setLocales] = useState<LocalDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [pagination, setPagination] = useState<PaginationMetadata>({
    skip: 0,
    limit: 10,
    total: 0,
    hasNext: false,
    hasPrev: false,
    currentPage: 1,
    totalPages: 0
  })
  const isMountedRef = useRef(true)
  const paginationRef = useRef(pagination)

  const fetchLocales = useCallback(async (params: LocalesListarParams = {}) => {
    const { skip = 0, limit = 10 } = params
    setLoading(true)
    setError(null)
    
    try {
      const result = await localesService.listar(params)
      
      if (result.success) {
        const localesMapeados = result.data.map((local: LocalResponseWithNames) => ({
          ...local,
          distrito: local.distrito_nombre || `Distrito ${local.distrito_id}`,
          tipo: local.tipo_local_nombre || `Tipo ${local.tipo_local_id}`,
          capacidad: local.aforo || 0,
          estado: local.activo ? 'Activo' : 'Inactivo',
          eventos: 0,
          fechaRegistro: local.fecha_creacion ? (() => {
            const fecha = new Date(local.fecha_creacion)
            const dia = fecha.getDate().toString().padStart(2, '0')
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
            const año = fecha.getFullYear()
            return `${dia}/${mes}/${año}`
          })() : ''
        }))
        setLocales(localesMapeados)
        
        // Actualizar información de paginación
        if (result.pagination) {
          setPagination(result.pagination)
        }
      } else {
        setError(result.detail || 'Error al cargar locales')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  const crearLocal = useCallback(async (localData: LocalRequest) => {
    try {
      const result = await localesService.crear(localData)
      if (result.success) {
        await fetchLocales({ skip: 0, limit: 10 })
        return result
      } else {
        if (isMountedRef.current) {
          setError(result.detail || 'Error al crear local')
        }
        return result
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error de conexión')
      }
      return { success: false, detail: 'Error de conexión' }
    }
  }, [fetchLocales])

  const eliminarLocal = useCallback(async (id: number) => {
    try {
      const result = await localesService.eliminar(id)
      if (result.success) {
        await fetchLocales({ skip: 0, limit: 10 })
        return true
      } else {
        if (isMountedRef.current) {
          setError(result.detail || 'Error al eliminar local')
        }
        return false
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error de conexión')
      }
      return false
    }
  }, [fetchLocales])

  const toggleLocalStatus = useCallback(async (id: number, activar: boolean) => {
    try {
      const result = await localesService.toggleStatus(id, activar)
      if (result.success) {
        await fetchLocales({ skip: 0, limit: 10 })
        return { success: true, error: null }
      } else {
        const errorMessage = result.detail || `Error al ${activar ? 'activar' : 'desactivar'} local`
        if (isMountedRef.current) {
          setError(errorMessage)
        }
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error de conexión al ${activar ? 'activar' : 'desactivar'} local`
      if (isMountedRef.current) {
        setError(errorMessage)
      }
      return { success: false, error: errorMessage }
    }
  }, [fetchLocales])

  // Función para obtener local por ID
  const fetchLocalById = useCallback(async (id: number) => {
    try {
      const result = await localesService.obtener(id)
      
      if (result.success) {
        return result.data
      } else {
        if (isMountedRef.current) {
          setError(result.detail || 'Error al cargar local')
        }
        return null
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error de conexión')
      }
      return null
    }
  }, [])

  const actualizarLocal = useCallback(async (id: number, localData: LocalRequest) => {
    try {
      const result = await localesService.actualizar(id, localData)
      if (result.success) {
        await fetchLocales({ skip: 0, limit: 10 })
        return result
      } else {
        if (isMountedRef.current) {
          setError(result.detail || 'Error al actualizar local')
        }
        return result
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error de conexión')
      }
      return { success: false, detail: 'Error de conexión' }
    }
  }, [fetchLocales])

  const fetchLocalesData = useCallback(async () => {
    await fetchLocales({ skip: 0, limit: 10 })
    setTimeout(() => {
      setIsInitialized(true)
    }, 100)
  }, [fetchLocales])

  useEffect(() => {
    paginationRef.current = pagination
  }, [pagination])

  useEffect(() => {
    if (!isInitialized) {
      fetchLocalesData()
    }
  }, [isInitialized, fetchLocalesData])

  const goToPage = useCallback((page: number) => {
    const skip = (page - 1) * paginationRef.current.limit
    fetchLocales({ skip, limit: paginationRef.current.limit })
  }, [fetchLocales])

  const nextPage = useCallback(() => {
    if (paginationRef.current.hasNext) {
      goToPage(paginationRef.current.currentPage + 1)
    }
  }, [goToPage])

  const prevPage = useCallback(() => {
    if (paginationRef.current.hasPrev) {
      goToPage(paginationRef.current.currentPage - 1)
    }
  }, [goToPage])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    // Estados de locales
    locales,
    loading,
    error,
    isInitialized,
    pagination,
    
    // Funciones de locales
    fetchLocales,
    fetchLocalById,
    crearLocal,
    actualizarLocal,
    eliminarLocal,
    deleteLocal: eliminarLocal,
    toggleLocalStatus,
    
    // Funciones de paginación
    goToPage,
    nextPage,
    prevPage,
    
    // Control de errores
    setError
  }
}