import { useState, useEffect, useCallback, useRef } from 'react'
import { categoriasEventoService } from '@/lib/api/services/eventos'
import { CategoriaEventoResponse } from '@/lib/types/entities/categoria-evento'

export const useCategoriasEvento = () => {
  const [categoriasEvento, setCategoriasEvento] = useState<CategoriaEventoResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchCategoriasEvento = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await categoriasEventoService.listar()
      if (result.success) {
        setCategoriasEvento(result.data)
      } else {
        if (isMountedRef.current) {
          setError(result.detail || 'Error al cargar categorías de eventos')
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar categorías de eventos')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategoriasEvento()
  }, [fetchCategoriasEvento])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    categoriasEvento,
    loading,
    error,
    fetchCategoriasEvento,
    setError
  }
}

