import { useState, useCallback, useRef } from 'react'
import { localesService } from '@/lib/api/services/locales'
import { LocalResponse } from '@/lib/types/entities/local'

export const useLocalesPorDistrito = () => {
  const [locales, setLocales] = useState<LocalResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchLocalesPorDistrito = useCallback(async (distritoId: number) => {
    if (!distritoId) {
      setLocales([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await localesService.listarPorDistrito(distritoId)
      if (result.success) {
        setLocales(result.data)
      } else {
        setError(result.detail || 'Error al cargar locales')
        setLocales([])
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar locales')
        setLocales([])
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const clearLocales = useCallback(() => {
    setLocales([])
    setError(null)
  }, [])

  return {
    locales,
    loading,
    error,
    fetchLocalesPorDistrito,
    clearLocales,
    setError
  }
}

