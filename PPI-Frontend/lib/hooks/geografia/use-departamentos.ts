import { useState, useEffect, useCallback, useRef } from 'react'
import { departamentosService } from '@/lib/api/services/geografia'
import { DepartamentoResponse } from '@/lib/types/entities/departamento'

export const useDepartamentos = () => {
  const [departamentos, setDepartamentos] = useState<DepartamentoResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchDepartamentos = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await departamentosService.listar()
      if (result.success) {
        setDepartamentos(result.data)
      } else {
        setError(result.detail || 'Error al cargar departamentos')
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar departamentos')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartamentos()
  }, [fetchDepartamentos])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    departamentos,
    loading,
    error,
    fetchDepartamentos,
    setError
  }
}

