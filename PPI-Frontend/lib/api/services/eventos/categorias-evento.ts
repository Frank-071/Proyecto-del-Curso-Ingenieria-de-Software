import { buildApiUrl, apiRequest } from '@/lib/api/config'
import { ListApiResponse } from '@/lib/types/shared/api-responses'
import { CategoriaEventoBackend, CategoriaEvento, normalizarCategoriaEvento } from '@/lib/types/entities/categoria-evento'

const ENDPOINTS = {
  LISTAR: '/categoria-evento/listar/'
}

export const categoriasEventoService = {
  listar: async (): Promise<ListApiResponse<CategoriaEvento>> => {
    // Endpoint público - no requiere autenticación
    const response = await apiRequest(buildApiUrl(ENDPOINTS.LISTAR), {}, false) as ListApiResponse<CategoriaEventoBackend>
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al cargar categorías')
    }
    return {
      ...response,
      data: response.data.map(normalizarCategoriaEvento)
    }
  }
}

