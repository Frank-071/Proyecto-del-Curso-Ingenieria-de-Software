import { apiRequest, buildApiUrl } from '@/lib/api/config'

export interface TransferConfirmRequest {
  destinatario_dni: string
  entrada_ids: number[]
}

export interface TransferHistoryItem {
  id: number
  tipo: string
  fecha_transferencia: string
  descripcion?: string
  evento?: {
    nombre?: string
  }
}

export const transferenciasService = {
  confirmar: (payload: TransferConfirmRequest) => {
    const url = buildApiUrl('/entradas/transfer/confirm')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },
  historialPorCliente: (clienteId: number) => {
    const url = buildApiUrl(`/transferencias/historial/${clienteId}`)
    return apiRequest(url)
  }
}
