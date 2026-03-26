import { useState, useEffect, useCallback, useRef } from 'react'
import { provinciasService } from '@/lib/api/services/geografia'
import { ProvinciaResponse } from '@/lib/types/entities/provincia'

export const useProvincias = () => {
  const [provincias, setProvincias] = useState<ProvinciaResponse[]>([])
  const [todasLasProvincias, setTodasLasProvincias] = useState<ProvinciaResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchProvincias = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await provinciasService.listar()
      if (result.success) {
        setTodasLasProvincias(result.data)
        setProvincias(result.data) // Inicialmente mostrar todas
      } else {
        setError(result.detail || 'Error al cargar provincias')
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar provincias')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProvinciasPorDepartamento = useCallback(async (departamentoId: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await provinciasService.listarPorDepartamento(departamentoId)
      if (result.success) {
        setProvincias(result.data)
      } else {
        setError(result.detail || 'Error al cargar provincias del departamento')
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar provincias del departamento')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProvincias()
  }, [fetchProvincias])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    provincias,
    todasLasProvincias,
    loading,
    error,
    fetchProvincias,
    fetchProvinciasPorDepartamento,
    setError
  }
}

