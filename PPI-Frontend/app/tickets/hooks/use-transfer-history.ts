'use client'

import { useCallback, useState } from 'react'
import { transferenciasService, type TransferHistoryItem } from '@/lib/api/services/transferencias'

interface UseTransferHistoryResult {
  historial: TransferHistoryItem[]
  loading: boolean
  error: string | null
  fetchHistorial: (clienteId: number) => Promise<void>
  clear: () => void
}

export const useTransferHistory = (): UseTransferHistoryResult => {
  const [historial, setHistorial] = useState<TransferHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorial = useCallback(async (clienteId: number) => {
    if (!clienteId || clienteId <= 0) {
      setHistorial([])
      setError('Cliente inválido')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await transferenciasService.historialPorCliente(clienteId)
      const list = Array.isArray(response?.historial)
        ? response.historial
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : []
      setHistorial(list)
    } catch (historialError) {
      setError(historialError instanceof Error ? historialError.message : 'No se pudo obtener el historial')
      setHistorial([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setHistorial([])
    setError(null)
  }, [])

  return {
    historial,
    loading,
    error,
    fetchHistorial,
    clear,
  }
}
