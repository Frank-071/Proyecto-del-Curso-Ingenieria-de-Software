import { buildApiUrl, apiRequest } from '@/lib/api/config'
import { tokenUtils } from '@/lib/auth/token'
import { LocalRequest, type LocalesImportInsertado, type LocalesImportResult } from '@/lib/types/entities/local'

const ENDPOINTS = {
  CREAR: '/local/crear/',
  LISTAR: '/local/listar/', 
  LISTAR_POR_DISTRITO: '/local/distrito',
  OBTENER: '/local',
  ACTUALIZAR: '/local',
  ELIMINAR: '/local',
  CAMBIAR_ESTADO: '/local/cambiar-estado',
  IMPORTAR: '/locales/import/'
}

export interface LocalesListarParams {
  skip?: number
  limit?: number
  tipo_local_id?: number
  activo?: boolean
  distrito_id?: number
  busqueda?: string
}

export const localesService = {
  crear: async (data: LocalRequest) => {
    const url = buildApiUrl(ENDPOINTS.CREAR)
    
    try {
      const result = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return { success: true, data: result }
    } catch (error) {
      console.error('Error creando local:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error al crear local'
      }
    }
  },

  listar: (params: LocalesListarParams = {}) => {
    const { skip = 0, limit = 10, tipo_local_id, activo, distrito_id, busqueda } = params
    
    const queryParams = new URLSearchParams()
    queryParams.append('skip', skip.toString())
    queryParams.append('limit', limit.toString())
    
    if (tipo_local_id !== undefined) {
      queryParams.append('tipo_local_id', tipo_local_id.toString())
    }
    
    if (activo !== undefined) {
      queryParams.append('activo', activo.toString())
    }
    
    if (distrito_id !== undefined) {
      queryParams.append('distrito_id', distrito_id.toString())
    }
    
    if (busqueda && busqueda.trim().length >= 2) {
      queryParams.append('busqueda', busqueda.trim())
    }
    
    const url = buildApiUrl(`${ENDPOINTS.LISTAR}?${queryParams.toString()}`)
    return apiRequest(url)
  },

  listarPorDistrito: (distritoId: number) =>
    apiRequest(buildApiUrl(`${ENDPOINTS.LISTAR_POR_DISTRITO}/${distritoId}`)),

  obtener: async (id: string | number) => {
    // Asegurar que el ID es un número
    const localId = typeof id === 'string' ? parseInt(id) : id
    const url = buildApiUrl(ENDPOINTS.OBTENER, localId)
    
    
    try {
      const result = await apiRequest(url, { method: 'GET' })
      return { success: true, data: result }
    } catch (error) {
      console.error('Error obteniendo local:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error al obtener local'
      }
    }
  },

  obtenerPorId: async (id: number) => {
    const url = buildApiUrl(ENDPOINTS.OBTENER, id)
    
    try {
      const result = await apiRequest(url, {
        method: 'GET'
      })
      
      return result
    } catch (error) {
      console.error('Error obteniendo local por ID:', error)
      throw error
    }
  },

  actualizar: async (id: string | number, data: LocalRequest) => {
    const localId = typeof id === 'string' ? parseInt(id) : id
    const url = buildApiUrl(ENDPOINTS.ACTUALIZAR, localId)
    
    try {
      const result = await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      return { success: true, data: result }
    } catch (error) {
      console.error('Error actualizando local:', error)
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error al actualizar local'
      }
    }
  },

  eliminar: (id: string | number) => 
    apiRequest(buildApiUrl(ENDPOINTS.ELIMINAR, id), {
      method: 'DELETE'
    }),

  toggleStatus: async (id: string | number, activar: boolean) => {
    try {
      const result = await apiRequest(`${buildApiUrl(ENDPOINTS.CAMBIAR_ESTADO, id)}?activar=${activar}`, {
        method: 'PATCH'
      })
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Error al cambiar estado del local'
      }
    }
  },

  importar: async (formData: FormData): Promise<LocalesImportResult> => {
    const url = buildApiUrl(ENDPOINTS.IMPORTAR)

    const sanitizeInsertados = (value: unknown): Array<string | LocalesImportInsertado> => {
      if (!Array.isArray(value)) return []

      return value.reduce<Array<string | LocalesImportInsertado>>((acc, current) => {
        if (typeof current === 'string') {
          acc.push(current)
          return acc
        }

        if (current && typeof current === 'object') {
          const entry = current as Record<string, unknown>
          const mensaje = typeof entry.mensaje === 'string' ? entry.mensaje : undefined
          const message = typeof entry.message === 'string' ? entry.message : undefined
          const fila = typeof entry.fila === 'number' ? entry.fila : undefined
          const nombre = typeof entry.nombre === 'string' ? entry.nombre : undefined
          const detalle = typeof entry.detalle === 'string' ? entry.detalle : undefined

          acc.push({ mensaje, message, fila, nombre, detalle })
        }

        return acc
      }, [])
    }

    const sanitizeErrores = (value: unknown): string[] => {
      if (!Array.isArray(value)) return []
      return value.filter((item): item is string => typeof item === 'string')
    }

    try {
      let token: string | null = null
      try {
        token = await tokenUtils.getToken()
      } catch (tokenError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error obteniendo token para importar locales:', tokenError)
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      })

      let parsedBody: unknown = null
      try {
        parsedBody = await response.json()
      } catch (parseError) {
        parsedBody = null
      }

      if (!response.ok) {
        const body = parsedBody && typeof parsedBody === 'object' ? parsedBody as Record<string, unknown> : null
        const detail = typeof body?.detail === 'string'
          ? body.detail
          : typeof body?.message === 'string'
            ? body.message
            : `Error ${response.status}: ${response.statusText}`

        return {
          success: false,
          detail
        }
      }

      const body = parsedBody && typeof parsedBody === 'object' ? parsedBody as Record<string, unknown> : null
      const dataField = body?.data && typeof body.data === 'object'
        ? body.data as Record<string, unknown>
        : null

      const errores = sanitizeErrores(dataField?.errores)
      const insertados = sanitizeInsertados(dataField?.insertados)

      return {
        success: true,
        data: {
          errores,
          insertados
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error al importar locales'
      return {
        success: false,
        detail
      }
    }
  }
}

