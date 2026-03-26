import { useState, useEffect, useCallback, useRef } from 'react'
import { tiposLocalesService } from '@/lib/api/services/locales'
import { TipoLocalResponse } from '@/lib/types/entities/tipo-local'

export const useTiposLocales = () => {
  const [tiposLocales, setTiposLocales] = useState<TipoLocalResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchTiposLocales = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await tiposLocalesService.listar()
      if (result.success) {
        setTiposLocales(result.data)
      } else {
        setError(result.detail || 'Error al cargar tipos de locales')
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar tipos de locales')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTiposLocales()
  }, [fetchTiposLocales])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    tiposLocales,
    loading,
    error,
    fetchTiposLocales,
    setError
  }
}

