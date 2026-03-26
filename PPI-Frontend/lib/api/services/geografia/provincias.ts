import { buildApiUrl, apiRequest } from '@/lib/api/config'

const ENDPOINTS = {
  LISTAR: '/provincia/listar/',
  LISTAR_POR_DEPARTAMENTO: '/provincia/departamento/'
}

export const provinciasService = {
  listar: () => 
    apiRequest(buildApiUrl(ENDPOINTS.LISTAR)),
  listarPorDepartamento: (departamentoId: number) =>
    apiRequest(buildApiUrl(`${ENDPOINTS.LISTAR_POR_DEPARTAMENTO}${departamentoId}`))
}

