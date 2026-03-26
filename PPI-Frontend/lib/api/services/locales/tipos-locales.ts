import { buildApiUrl, apiRequest } from '@/lib/api/config'

const ENDPOINTS = {
  LISTAR: '/tipo-local/listar/'
}

export const tiposLocalesService = {
  listar: () => 
    apiRequest(buildApiUrl(ENDPOINTS.LISTAR))
}

