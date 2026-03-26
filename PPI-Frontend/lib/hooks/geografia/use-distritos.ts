import { useState, useEffect, useCallback, useRef } from 'react'
import { distritosService } from '@/lib/api/services/geografia'
import { DistritoResponse } from '@/lib/types/entities/distrito'

export const useDistritos = () => {
  const [distritos, setDistritos] = useState<DistritoResponse[]>([])
  const [todosLosDistritos, setTodosLosDistritos] = useState<DistritoResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchDistritos = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await distritosService.listar()
      if (result.success) {
        setTodosLosDistritos(result.data)
        setDistritos(result.data) // Inicialmente mostrar todos
      } else {
        setError(result.detail || 'Error al cargar distritos')
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar distritos')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDistritosPorProvincia = useCallback(async (provinciaId: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await distritosService.listarPorProvincia(provinciaId)
      if (result.success) {
        setDistritos(result.data)
      } else {
        setError(result.detail || 'Error al cargar distritos de la provincia')
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Error al cargar distritos de la provincia')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDistritos()
  }, [fetchDistritos])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    distritos,
    todosLosDistritos,
    loading,
    error,
    fetchDistritos,
    fetchDistritosPorProvincia,
    setError
  }
}

