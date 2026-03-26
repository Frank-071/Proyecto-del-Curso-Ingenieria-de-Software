import { useCallback, useState } from 'react'
import { entradassService } from '@/lib/api/services/eventos'

export interface EntradaEventoInfo {
  evento_id: number
  nombre: string
  fecha_hora_inicio?: string | null
  fecha_hora_fin?: string | null
  estado?: string | null
  local_id?: number | null
  icono?: string | null
}

export interface EntradaZonaInfo {
  zona_id: number
  nombre: string
  descripcion?: string | null
  precio?: string | number | null
  evento?: EntradaEventoInfo | null
}

export interface EntradaClienteItem {
  id: number
  zona_id: number
  fecha_creacion?: string | null
  fue_transferida: boolean
  total_zona?: string | number | null
  fecha_transaccion?: string | null
  zona?: EntradaZonaInfo | null
}

export const useEntradasCliente = () => {
  const [entradas, setEntradas] = useState<EntradaClienteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listarPorCliente = useCallback(async (clienteId: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await entradassService.listarPorCliente(clienteId)
      let entradasData: EntradaClienteItem[] = []
      
      if (res && res.success !== false && Array.isArray(res.data)) {
        entradasData = res.data as EntradaClienteItem[]
      } else if (Array.isArray(res)) {
        entradasData = res as EntradaClienteItem[]
      } else {
        setEntradas([])
        return { success: false, detail: res?.detail || 'Sin datos' }
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      // Usar fecha_creacion si está disponible, sino fecha_transaccion
      entradasData.sort((a, b) => {
        const fechaA = a.fecha_creacion || a.fecha_transaccion || ''
        const fechaB = b.fecha_creacion || b.fecha_transaccion || ''
        
        if (!fechaA && !fechaB) return 0
        if (!fechaA) return 1
        if (!fechaB) return -1
        
        // Ordenar descendente (más recientes primero)
        return new Date(fechaB).getTime() - new Date(fechaA).getTime()
      })
      
      setEntradas(entradasData)
      return { success: true, data: entradasData }
    } catch (e: any) {
      setError('Error de conexión')
      return { success: false, detail: e?.message || 'Error' }
    } finally {
      setLoading(false)
    }
  }, [])

  return { entradas, loading, error, listarPorCliente, setEntradas, setError }
}

