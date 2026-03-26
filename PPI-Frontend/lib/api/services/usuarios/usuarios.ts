import { buildApiUrl, apiRequest } from "@/lib/api/config"
import { UsuarioRequest } from "@/lib/types/entities/usuario"
import { tokenUtils } from '@/lib/auth/token'


const ENDPOINTS = {
    CREAR: "/usuario/crear/",
    LISTAR: "/usuario/listar/",
    OBTENER: "/usuario",
    ACTUALIZAR: "/usuario",
    ELIMINAR: "/usuario",
    CAMBIAR_ESTADO: "/usuario/cambiar-estado",
}

export interface UsuariosListarParams {
    skip?: number
    limit?: number
    busqueda?: string
    activo?: boolean
}

export const usuariosService = {
    crear: async (data: UsuarioRequest) => {
        try {
            const url = buildApiUrl(ENDPOINTS.CREAR)
            const result = await apiRequest(url, {
                method: "POST",
                body: JSON.stringify(data),
            })
            return { success: true, data: result }
        } catch (error) {
            return {
                success: false,
                detail: error instanceof Error ? error.message : "Error al crear usuario",
            }
        }
    },

    listar: async (params: UsuariosListarParams = {}) => {
        const { skip = 0, limit = 10, busqueda, activo } = params

        const queryParams = new URLSearchParams()
        queryParams.append("skip", skip.toString())
        queryParams.append("limit", limit.toString())

        if (busqueda && busqueda.trim().length >= 2) {
            queryParams.append("busqueda", busqueda.trim())
        }

        if (activo !== undefined) {
            queryParams.append("activo", activo.toString())
        }

        const url = buildApiUrl(`${ENDPOINTS.LISTAR}?${queryParams.toString()}`)
        return apiRequest(url)  
    }


    ,

    obtener: async (id: number | string) => {
        const uid = typeof id === "string" ? parseInt(id) : id
        const url = buildApiUrl(ENDPOINTS.OBTENER, uid)

        try {
            const result = await apiRequest(url, { method: "GET" })
            return { success: true, data: result }
        } catch (error) {
            return {
                success: false,
                detail: "Error al obtener usuario",
            }
        }
    },

    actualizar: async (id: number | string, data: UsuarioRequest) => {
        const uid = typeof id === "string" ? parseInt(id) : id
        const url = buildApiUrl(ENDPOINTS.ACTUALIZAR, uid)

        try {
            const result = await apiRequest(url, {
                method: "PUT",
                body: JSON.stringify(data),
            })
            return { success: true, data: result }
        } catch (error) {
            return {
                success: false,
                detail: "Error al actualizar usuario",
            }
        }
    },

    eliminar: async (id: number | string) =>
        apiRequest(buildApiUrl(ENDPOINTS.ELIMINAR, id), {
            method: "DELETE",
        }),

    toggleStatus: async (id: number | string, activar: boolean) => {
        try {
            const url = `${buildApiUrl(ENDPOINTS.CAMBIAR_ESTADO, id)}?activar=${activar}`
            const token = await tokenUtils.getToken()
            const res = await apiRequest(url, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json" ,
                ...(token && { 'Authorization': `Bearer ${token}` }),}
            })

            return { success: true, data: res }
        } catch (error) {
            return {
                success: false,
                detail: "Error al cambiar estado del usuario",
            }
        }
    },
}
