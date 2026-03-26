import { useState, useCallback } from 'react'
import { eventosService, type EventosListarParams } from '@/lib/api/services/eventos'
import type { EventosDashboardResumen } from '@/lib/types/evento'

export const useEventos = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const crearEvento = useCallback(async (formData: FormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await eventosService.crear(formData)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al crear evento')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const listarEventos = useCallback(async (params: EventosListarParams = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await eventosService.listar(params)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al listar eventos')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const obtenerEventoPorId = useCallback(async (eventoId: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await eventosService.obtenerPorId(eventoId)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al obtener evento')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const actualizarEvento = useCallback(async (eventoId: number, formData: FormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await eventosService.actualizar(eventoId, formData)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al actualizar evento')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const obtenerDashboardResumen = useCallback(async (): Promise<
    | { success: true; data: EventosDashboardResumen }
    | { success: false; detail: string }
  > => {
    try {
      const result = await eventosService.obtenerDashboardResumen()
      if (!result.success) {
        const detail = result.detail ?? 'Error al obtener resumen de eventos'
        setError(detail)
        return { success: false, detail }
      }
      const data = result.data ?? {
        totalEventos: 0,
        eventosPublicados: 0,
        ticketsVendidos: 0,
        ingresosEstimados: 0
      }
      return { success: true, data }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    }
  }, [])

  return {
    loading,
    error,
    crearEvento,
    actualizarEvento,
    listarEventos,
    obtenerEventoPorId,
    obtenerDashboardResumen,
    setError
  }
}