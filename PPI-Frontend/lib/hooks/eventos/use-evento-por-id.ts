import { useState, useEffect } from 'react'
import { eventosService } from '@/lib/api/services/eventos'
import { EventoResponse } from '@/lib/types/entities/evento'

export const useEventoPorId = (eventoId: number) => {
  const [evento, setEvento] = useState<EventoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarEvento = async () => {
      if (!eventoId || eventoId <= 0) {
        setError('ID de evento inválido')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Usar el endpoint público que no requiere autenticación
        const result = await eventosService.obtenerPublicoPorId(eventoId)
        
        if (result.success && result.data) {
          setEvento(result.data)
        } else {
          setError(result.detail || 'No se pudo cargar el evento')
        }
      } catch (err) {
        console.error('Error cargando evento:', err)
        setError('Error de conexión al cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    cargarEvento()
  }, [eventoId])

  return {
    evento,
    loading,
    error,
    setError
  }
}

