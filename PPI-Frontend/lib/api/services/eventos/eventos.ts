import { buildApiUrl, apiRequest } from '@/lib/api/config'
import { tokenUtils } from '@/lib/auth/token'
import { ApiResult, PaginationMetadata } from '@/lib/types/shared/api-responses'
import { EventoPublicResponse } from '@/lib/types/entities/evento'
import type { EventosDashboardResumen } from '@/lib/types/evento'

const ENDPOINTS = {
  CREAR: '/eventos/',
  LISTAR: '/eventos/listar',
  LISTAR_PUBLICOS: '/eventos/publicos',
  OBTENER: '/eventos',
  ACTUALIZAR: '/eventos',
  DASHBOARD_RESUMEN: '/eventos/dashboard-resumen'
}

export interface EventosListarParams {
  skip?: number
  limit?: number
  categoria_id?: number
  estado?: string
  periodo?: string
  busqueda?: string
}

export interface EventosPublicosParams {
  skip?: number
  limit?: number
  categoria_id?: number
  distrito_id?: number
  fecha_inicio?: string
  busqueda?: string
}

export const eventosService = {
  crear: async (formData: FormData) => {
    const url = buildApiUrl(ENDPOINTS.CREAR)
    
    try {
      const token = await tokenUtils.getToken()
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        
        // Si es 401, redirigir al login usando el sistema centralizado
        if (response.status === 401 && typeof window !== 'undefined') {
          await tokenUtils.removeToken()
          window.location.href = '/login'
        }
        
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Error de conexión:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  },

  listar: (params: EventosListarParams = {}) => {
    const { skip = 0, limit = 10, categoria_id, estado, periodo, busqueda } = params
    
    const queryParams = new URLSearchParams()
    queryParams.append('skip', skip.toString())
    queryParams.append('limit', limit.toString())
    
    if (categoria_id !== undefined) {
      queryParams.append('categoria_id', categoria_id.toString())
    }
    
    if (estado) {
      queryParams.append('estado', estado)
    }
    
    if (periodo) {
      queryParams.append('periodo', periodo)
    }
    
    if (busqueda && busqueda.trim().length >= 2) {
      queryParams.append('busqueda', busqueda.trim())
    }
    
    const url = buildApiUrl(`${ENDPOINTS.LISTAR}?${queryParams.toString()}`)
    
    return fetch(url, {
      method: 'GET'
    }).then(async response => {
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data: data.data, pagination: data.pagination }
    }).catch(error => {
      console.error('Error de conexión:', error)
      return { 
        success: false, 
        detail: 'Error de conexión con el servidor: ' + error.message 
      }
    })
  },

  listarPublicos: async (params: EventosPublicosParams = {}): Promise<ApiResult<EventoPublicResponse[]> & { pagination?: PaginationMetadata }> => {
    const { skip = 0, limit = 10, categoria_id, distrito_id, fecha_inicio, busqueda } = params
    
    const queryParams = new URLSearchParams()
    queryParams.append('skip', skip.toString())
    queryParams.append('limit', limit.toString())
    
    if (categoria_id !== undefined) {
      queryParams.append('categoria_id', categoria_id.toString())
    }
    
    if (distrito_id !== undefined) {
      queryParams.append('distrito_id', distrito_id.toString())
    }
    
    if (fecha_inicio) {
      queryParams.append('fecha_inicio', fecha_inicio)
    }
    
    if (busqueda && busqueda.trim().length >= 2) {
      queryParams.append('busqueda', busqueda.trim())
    }
    
    const url = buildApiUrl(`${ENDPOINTS.LISTAR_PUBLICOS}?${queryParams.toString()}`)

    try {
      const response = await fetch(url, { method: 'GET' })
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data: data.data, pagination: data.pagination }
    } catch (error) {
      console.error('Error de conexión:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  },

  obtenerDashboardResumen: async (): Promise<
    | { success: true; data: EventosDashboardResumen }
    | { success: false; detail: string }
  > => {
    const url = buildApiUrl(ENDPOINTS.DASHBOARD_RESUMEN)

    try {
      const token = await tokenUtils.getToken()

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        return {
          success: false as const,
          detail: data.detail || data.message || `Error ${response.status}: ${response.statusText}`
        }
      }

      const payload = data?.data ?? {}

      const summary: EventosDashboardResumen = {
        totalEventos: Number(payload.total_eventos ?? 0),
        eventosPublicados: Number(payload.eventos_publicados ?? 0),
        ticketsVendidos: Number(payload.tickets_vendidos ?? 0),
        ingresosEstimados: Number(payload.ingresos_estimados ?? 0)
      }

      return {
        success: true as const,
        data: summary
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      return {
        success: false as const,
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  },

  obtenerPorId: async (eventoId: number) => {
    const url = buildApiUrl(`${ENDPOINTS.OBTENER}/${eventoId}`)
    
    
    try {
      // Obtener token usando el sistema centralizado de tokens
      const token = await tokenUtils.getToken()
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      })
      
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        
        // Si es 401, redirigir al login usando el sistema centralizado
        if (response.status === 401 && typeof window !== 'undefined') {
          await tokenUtils.removeToken()
          window.location.href = '/login'
        }
        
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data: data.data }
    } catch (error) {
      console.error('Error de conexión:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  },

  obtenerOrganizadorContacto: async (eventoId: number) => {
    const url = buildApiUrl(`${ENDPOINTS.OBTENER}/${eventoId}/organizador-contacto`)

    try {
      const token = await tokenUtils.getToken()

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error del backend:', response.status, data)

        if (response.status === 401 && typeof window !== 'undefined') {
          await tokenUtils.removeToken()
          window.location.href = '/login'
        }

        return {
          success: false,
          detail: data.detail || `Error ${response.status}: ${response.statusText}`,
        }
      }

      return { success: true, data: data.data ?? null }
    } catch (error) {
      console.error('Error de conexión:', error)
      return {
        success: false,
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor',
      }
    }
  },

  obtenerPublicoPorId: async (eventoId: number) => {
    const url = buildApiUrl(`${ENDPOINTS.LISTAR_PUBLICOS}/${eventoId}`)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data: data.data }
    } catch (error) {
      console.error('Error de conexión:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  },

  actualizarEstado: async (eventoId: number, nuevoEstado: string, motivo_cancelacion?: string | null) => {
    const url = buildApiUrl(`${ENDPOINTS.ACTUALIZAR}/${eventoId}/estado`)
    
    
    try {
      // Obtener token usando el sistema centralizado de tokens
      const token = await tokenUtils.getToken()
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ estado: nuevoEstado, motivo_cancelacion })
      })
      
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        
        // Si es 401, redirigir al login usando el sistema centralizado
        if (response.status === 401 && typeof window !== 'undefined') {
          await tokenUtils.removeToken()
          window.location.href = '/login'
        }
        
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data: data.data }
    } catch (error) {
      console.error('Error de conexión:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  },

  actualizar: async (eventoId: number, formData: FormData) => {
    const url = buildApiUrl(`${ENDPOINTS.ACTUALIZAR}/${eventoId}/form`)
    
    
    try {
      // Obtener token usando el sistema centralizado de tokens
      const token = await tokenUtils.getToken()
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData
      })
      
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error del backend:', response.status, data)
        
        // Si es 401, redirigir al login usando el sistema centralizado
        if (response.status === 401 && typeof window !== 'undefined') {
          await tokenUtils.removeToken()
          window.location.href = '/login'
        }
        
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Error de conexión:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  },

  hasEntradasVendidas: async (eventoId: number) => {
    const url = buildApiUrl(`${ENDPOINTS.OBTENER}/${eventoId}/tiene-entradas-vendidas`)
    
    try {
      const token = await tokenUtils.getToken()
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { 
          success: false, 
          detail: data.detail || `Error ${response.status}: ${response.statusText}` 
        }
      }
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  }
}

