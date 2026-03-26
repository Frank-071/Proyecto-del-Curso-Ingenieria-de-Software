import { buildApiUrl, apiRequest } from '@/lib/api/config'

const ENDPOINTS = {
  LISTAR: '/departamento/listar/'
}

export const departamentosService = {
  listar: () => 
    apiRequest(buildApiUrl(ENDPOINTS.LISTAR))
}

