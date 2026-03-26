import { buildApiUrl, apiRequest } from '@/lib/api/config'
import { EntradaRequest } from '@/lib/types/entities/entrada'
import { tokenUtils } from '@/lib/auth/token'

const ENDPOINTS = {
    CREAR: '/entradas/',
    CREAR_BULK: '/entradas/bulk',
    CREAR_BULK_MULTI: '/entradas/bulk-multi',
    ENVIAR_ENTRADAS: '/entradas/enviar-correo'
}

export const entradassService = {
    crear: (entradaData: EntradaRequest) => {
        const url = buildApiUrl(ENDPOINTS.CREAR)

        console.log('=== ENVIANDO AL BACKEND ===')
        console.log('URL:', url)
        console.log("🟢 Datos enviados:", JSON.stringify(entradaData, null, 2))
        // Para FormData no incluir Content-Type, el browser lo maneja automáticamente
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // <- esto es clave
            },
            body: JSON.stringify(entradaData),


        }).then(async response => {
            console.log('=== RESPUESTA DEL BACKEND ===')
            console.log('Status:', response.status, response.statusText)

            const data = await response.json()
            console.log('Response data:', data)

            if (!response.ok) {
                console.error('Error del backend:', response.status, data)
                return {
                    success: false,
                    detail: data.detail || `Error ${response.status}: ${response.statusText}`
                }
            }

            console.log('Éxito del backend')
            return { success: true, data }
        }).catch(error => {
            console.error('❌ Error de conexión:', error)
            return {
                success: false,
                detail: 'Error de conexión con el servidor: ' + error.message
            }
        })
    },

    crearBulk: async (zona_id: number, cantidad: number, descuento_total: number = 0, total_entradas_checkout: number = 1, puntos_canjeados: number = 0) => {
        const url = buildApiUrl(`${ENDPOINTS.CREAR_BULK}?zona_id=${zona_id}&cantidad=${cantidad}&descuento_total=${descuento_total}&total_entradas_checkout=${total_entradas_checkout}&puntos_canjeados=${puntos_canjeados}`)
        const token = await tokenUtils.getToken()

        console.log('=== ENVIANDO BULK AL BACKEND ===')
        console.log('URL:', url)
        console.log(`🟢 Creando ${cantidad} entradas para zona ${zona_id}`)
        console.log(`💰 Descuento total: ${descuento_total}, Total entradas checkout: ${total_entradas_checkout}`)
        console.log(`🎯 Puntos canjeados: ${puntos_canjeados}`)

        return fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }).then(async response => {
            console.log('=== RESPUESTA BULK DEL BACKEND ===')
            console.log('Status:', response.status, response.statusText)

            const data = await response.json()
            console.log('Response data:', data)

            if (!response.ok) {
                console.error('Error del backend:', response.status, data)
                return {
                    success: false,
                    detail: data.detail || `Error ${response.status}: ${response.statusText}`
                }
            }

            console.log('✅ Bulk exitoso:', data)
            return { success: true, data }
        }).catch(error => {
            console.error('❌ Error de conexión bulk:', error)
            return {
                success: false,
                detail: 'Error de conexión con el servidor: ' + error.message
            }
        })
    },

    listarPorCliente: async (clienteId: number) => {
        const idNum = Number(clienteId)
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return { success: false, detail: 'clienteId inválido' }
        }
        const url = buildApiUrl(`/entradas/cliente/${idNum}`)
        try {
            const response = await fetch(url, { method: 'GET' })
            const data = await response.json()
            if (!response.ok) {
                return { success: false, detail: data.detail || `Error ${response.status}: ${response.statusText}` }
            }
            return data
        } catch (error: any) {
            return { success: false, detail: 'Error de conexión con el servidor: ' + error.message }
        }
    },

    enviarEntradas: async (payload: any) => {
        const url = buildApiUrl(ENDPOINTS.ENVIAR_ENTRADAS)
        const token = await tokenUtils.getToken()

        console.log("=== ENVIANDO ENTRADAS POR CORREO ===")
        console.log("URL:", url)
        console.log("📦 Payload:", payload)

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json()
            console.log("=== RESPUESTA ENVIAR ===")
            console.log(data)

            if (!response.ok) {
                return {
                    success: false,
                    detail: data.detail || "Error enviando entradas"
                }
            }

            return { success: true, data }

        } catch (error: any) {
            return {
                success: false,
                detail: "Error de conexión con el servidor: " + error.message
            }
        }
    },

    crearBulkMulti: async (payload: any) => {
        const url = buildApiUrl(ENDPOINTS.CREAR_BULK_MULTI)
        const token = await tokenUtils.getToken()

        console.log('=== ENVIANDO BULK-MULTI AL BACKEND ===')
        console.log('URL:', url)
        console.log('Payload:', payload)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json()
            console.log('=== RESPUESTA BULK-MULTI ===', data)

            if (!response.ok) {
                return { success: false, detail: data.detail || `Error ${response.status}` }
            }

            return { success: true, detail: data.detail, data }
        } catch (error: any) {
            console.error('❌ Error de conexión bulk-multi:', error)
            return { success: false, detail: 'Error de conexión: ' + error.message }
        }
    },

    getLimiteEvento: async (eventoId: number) => {
        const url = buildApiUrl(`/entradas/evento/${eventoId}/limite`)

        try {
            const data = await apiRequest(url, { method: 'GET' }, true)
            return { success: true, data }
        } catch (error: any) {
            return {
                success: false,
                detail: error.message || 'Error obteniendo límite de entradas'
            }
        }
    },

    getQrPdfUrl: async (entradaId: number) => {
        const url = buildApiUrl(`/entradas/${entradaId}/qr-pdf`)
        
        try {
            const data = await apiRequest(url, { method: 'GET' }, true)
            // La respuesta puede tener estructura: { success: true, message: "...", data: { pdf_url: "...", entrada_id: ... } }
            // o directamente: { pdf_url: "...", entrada_id: ... }
            return { success: true, data }
        } catch (error: any) {
            // Si es un 404 o error similar, no es un error crítico, solo significa que no hay PDF
            if (error.message && (error.message.includes('404') || error.message.includes('No encontrado'))) {
                return {
                    success: false,
                    detail: 'PDF no disponible'
                }
            }
            return {
                success: false,
                detail: error.message || 'Error obteniendo URL del PDF'
            }
        }
    }

}

