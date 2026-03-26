import { apiRequest, buildApiUrl } from '@/lib/api/config'

export interface ClienteBusquedaResponse {
  cliente_id?: number
  nombres?: string
  apellidos?: string
  dni?: string
}

export const clientesService = {
  buscarPorDni: async (dni: string): Promise<ClienteBusquedaResponse> => {
    const sanitized = dni.trim()
    if (!sanitized) {
      throw new Error('DNI requerido')
    }
    const url = buildApiUrl(`/clientes/buscar?dni=${encodeURIComponent(sanitized)}`)
    return apiRequest(url, { method: 'GET' }, false)
  }
}
