import { useState, useCallback } from 'react'
import { zonasService } from '@/lib/api/services/eventos'
import { ZonaRequest } from '@/lib/types/entities/zona'

export const useZonas = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const crearZona = useCallback(async (zonaData: ZonaRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await zonasService.crear(zonaData)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al crear zona')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const crearMultiplesZonas = useCallback(async (zonas: ZonaRequest[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const resultados = await Promise.all(
        zonas.map(zona => zonasService.crear(zona))
      )
      
      const errores = resultados.filter(r => !r.success)
      
      if (errores.length > 0) {
        setError(`Error creando ${errores.length} zonas`)
        return { success: false, detail: `Error creando ${errores.length} zonas`, resultados }
      }
      
      return { success: true, resultados }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const actualizarZona = useCallback(async (zonaId: number, zonaData: ZonaRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await zonasService.actualizar(zonaId, zonaData)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al actualizar zona')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const eliminarZona = useCallback(async (zonaId: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await zonasService.eliminar(zonaId)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al eliminar zona')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const eliminarZonasDelEvento = useCallback(async (eventoId: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await zonasService.eliminarZonasDelEvento(eventoId)
      if (result.success) {
        return result
      } else {
        setError(result.detail || 'Error al eliminar zonas del evento')
        return result
      }
    } catch (err) {
      setError('Error de conexión')
      return { success: false, detail: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    crearZona,
    actualizarZona,
    eliminarZona,
    eliminarZonasDelEvento,
    crearMultiplesZonas,
    setError
  }
}

