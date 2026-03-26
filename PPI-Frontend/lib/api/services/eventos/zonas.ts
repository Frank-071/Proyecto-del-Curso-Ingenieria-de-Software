import { buildApiUrl, apiRequest } from '@/lib/api/config'
import { ZonaRequest } from '@/lib/types/entities/zona'

const ENDPOINTS = {
  CREAR: '/zonas/',
  ACTUALIZAR: '/zonas',
  ELIMINAR: '/zonas'
}

export const zonasService = {
  listarPorEvento: async (eventoId: number) => {
    const url = buildApiUrl(`/zonas/evento/${eventoId}`)


    try {
      const result = await apiRequest(url, { method: 'GET' }, false)
      return result
    } catch (error) {
      throw error
    }
  },

  crear: async (data: ZonaRequest) => {
    const url = buildApiUrl(ENDPOINTS.CREAR)
    const body = JSON.stringify(data)
    
    
    try {
      const result = await apiRequest(url, {
        method: 'POST',
        body: body
      })
      
      return result
    } catch (error) {
      throw error
    }
  },

  actualizar: async (zonaId: number, data: ZonaRequest) => {
    const url = buildApiUrl(`${ENDPOINTS.ACTUALIZAR}/${zonaId}`)
    const body = JSON.stringify(data)
    
    
    try {
      const result = await apiRequest(url, {
        method: 'PUT',
        body: body
      })
      
      return result
    } catch (error) {
      throw error
    }
  },

  eliminar: async (zonaId: number) => {
    const url = buildApiUrl(`${ENDPOINTS.ELIMINAR}/${zonaId}`)
    
    
    try {
      const result = await apiRequest(url, {
        method: 'DELETE'
      })
      
      return result
    } catch (error) {
      throw error
    }
  },

  eliminarZonasDelEvento: async (eventoId: number) => {
    const url = buildApiUrl(`${ENDPOINTS.ELIMINAR}/evento/${eventoId}`)
    
    
    try {
      const result = await apiRequest(url, {
        method: 'DELETE'
      })
      
      return result
    } catch (error) {
      throw error
    }
  }
}

