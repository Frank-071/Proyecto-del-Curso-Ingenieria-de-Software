import { buildApiUrl, apiRequest } from '@/lib/api/config'
import { ListApiResponse } from '@/lib/types/shared/api-responses'
import { DistritoBackend, Distrito, normalizarDistrito } from '@/lib/types/entities/distrito'

const ENDPOINTS = {
  LISTAR: '/distrito/listar/',
  LISTAR_PUBLICOS: '/distrito/publicos',
  LISTAR_POR_PROVINCIA: '/distrito/provincia/'
}

export const distritosService = {
  listar: async (): Promise<ListApiResponse<Distrito>> => {
    const response = await apiRequest(buildApiUrl(ENDPOINTS.LISTAR), {}, true) as ListApiResponse<DistritoBackend>
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al cargar distritos')
    }
    return {
      ...response,
      data: response.data.map(normalizarDistrito)
    }
  },
  listarPublicos: async (): Promise<ListApiResponse<Distrito>> => {
    // Endpoint público - no requiere autenticación
    const response = await apiRequest(buildApiUrl(ENDPOINTS.LISTAR_PUBLICOS), {}, false) as ListApiResponse<DistritoBackend>
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al cargar distritos')
    }
    return {
      ...response,
      data: response.data.map(normalizarDistrito)
    }
  },
  listarPorProvincia: async (provinciaId: number): Promise<ListApiResponse<Distrito>> => {
    const response = await apiRequest(buildApiUrl(`${ENDPOINTS.LISTAR_POR_PROVINCIA}${provinciaId}`), {}, true) as ListApiResponse<DistritoBackend>
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al cargar distritos')
    }
    return {
      ...response,
      data: response.data.map(normalizarDistrito)
    }
  }
}

