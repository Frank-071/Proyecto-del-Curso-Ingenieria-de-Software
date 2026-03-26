import { buildApiUrl, apiRequest } from '@/lib/api/config'

const ENDPOINTS = {
  LISTAR: '/organizador/listar/'
}

export const organizadoresService = {
  listar: () => 
    apiRequest(buildApiUrl(ENDPOINTS.LISTAR))
}

