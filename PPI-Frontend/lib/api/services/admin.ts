import { buildApiUrl, apiRequest } from '@/lib/api/config'
import { ApiResult } from '@/lib/types/shared/api-responses'

export interface AdminStats {
    totalLocales: number
    totalEventos: number
    totalUsuarios: number
    eventosActivos: number
    adminName: string
    fechaCreacion?: string
}

const ENDPOINTS = {
    STATS: '/admin/dashboard/stats'
}

export const adminService = {
    getStats: async (): Promise<ApiResult<AdminStats>> => {
        const url = buildApiUrl(ENDPOINTS.STATS)

        try {
            const data = await apiRequest(url, { method: 'GET' }, true)

            return { success: true, data: data.data || data }
        } catch (error) {
            console.error('Error fetching admin stats:', error)
            return {
                success: false,
                detail: error instanceof Error ? error.message : 'Error desconocido'
            }
        }
    }
}
