import { useState, useCallback } from 'react'
import { entradassService } from '@/lib/api/services/eventos'
import type { EntradaRequest } from '@/lib/types/entities/entrada'

export const useEntradas = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const crearEntrada = useCallback(async (entradaData: EntradaRequest) => {
        setLoading(true)
        setError(null)

        try {
            const result = await entradassService.crear(entradaData)
            if (result.success) {
                return result
            } else {
                setError(result.detail || 'Error al crear entrada')
                return result
            }
        } catch (err) {
            setError('Error de conexión')
            return { success: false, detail: 'Error de conexión' }
        } finally {
            setLoading(false)
        }
    }, [])

    const crearEntradaBulk = useCallback(async (zona_id: number, cantidad: number, descuento_total: number = 0, total_entradas_checkout: number = 1, puntos_canjeados: number = 0) => {
        setLoading(true)
        setError(null)

        try {
            const result = await entradassService.crearBulk(zona_id, cantidad, descuento_total, total_entradas_checkout, puntos_canjeados)
            if (result.success) {
                return result
            } else {
                setError(result.detail || 'Error al crear entradas')
                return result
            }
        } catch (err) {
            setError('Error de conexión')
            return { success: false, detail: 'Error de conexión' }
        } finally {
            setLoading(false)
        }
    }, [])

    const enviarEntradas = useCallback(async (entradasParaEnviar: any) => {
        setLoading(true)
        setError(null)

        try {
            const result = await entradassService.enviarEntradas({ entradas: entradasParaEnviar })

            if (result.success) {
                return result
            } else {
                setError(result.detail || "Error enviando entradas por correo")
                return result
            }

        } catch (err) {
            setError("Error de conexión")
            return { success: false, detail: "Error de conexión" }
        } finally {
            setLoading(false)
        }
    }, [])

    const crearEntradasBulkMulti = useCallback(async (payload: any) => {
        setLoading(true)
        setError(null)

        try {
            const result = await entradassService.crearBulkMulti(payload)
            if (result.success) {
                return result
            } else {
                setError(result.detail || 'Error al crear entradas bulk-multi')
                return result
            }
        } catch (err) {
            setError('Error de conexión')
            return { success: false, detail: 'Error de conexión' }
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        loading,
        error,
        crearEntrada,
        crearEntradaBulk,
        crearEntradasBulkMulti,
        enviarEntradas,
        setError
    }
}

