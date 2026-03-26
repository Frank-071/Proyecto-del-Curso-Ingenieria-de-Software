import { useState, useEffect } from 'react'
import { entradassService } from '@/lib/api/services/eventos/entradas'

export interface EntradaLimite {
    entradas_compradas: number
    entradas_disponibles: number
    limite_alcanzado: boolean
}

export function useEntradaLimite(eventoId: number | undefined, isAuthenticated: boolean) {
    const [limite, setLimite] = useState<EntradaLimite | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!eventoId || !isAuthenticated) {
            setLimite(null)
            setLoading(false)
            setError(null)
            return
        }

        const fetchLimite = async () => {
            setLoading(true)
            setError(null)

            const result = await entradassService.getLimiteEvento(eventoId)

            if (result.success && result.data) {
                setLimite(result.data)
            } else {
                setError(result.detail || 'Error al obtener límite de entradas')
            }

            setLoading(false)
        }

        fetchLimite()
    }, [eventoId, isAuthenticated])

    return { limite, loading, error }
}
