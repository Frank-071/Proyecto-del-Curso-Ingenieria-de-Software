import { useState, useEffect } from 'react'
import { adminService, AdminStats } from '@/lib/api/services/admin'
import { useAuth } from '@/lib/hooks/auth'

export function useAdminStats() {
    const { userInfo } = useAuth()
    const [stats, setStats] = useState<AdminStats>({
        totalLocales: 0,
        totalEventos: 0,
        totalUsuarios: 0,
        eventosActivos: 0,
        adminName: "",
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userInfo) return

        const fetchStats = async () => {
            setLoading(true)
            const result = await adminService.getStats()

            if (result.success) {
                setStats(result.data)
                setError(null)
            } else {
                setError(result.detail || 'Error al cargar estadísticas')
            }
            setLoading(false)
        }

        fetchStats()
    }, [userInfo])

    return { stats, loading, error }
}
