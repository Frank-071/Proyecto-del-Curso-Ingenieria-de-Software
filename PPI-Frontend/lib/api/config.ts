import { tokenUtils } from '@/lib/auth/token'

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export const buildApiUrl = (endpoint: string, id?: string | number) => {
  const baseUrl = `${API_CONFIG.BASE_URL}${endpoint}`
  return id ? `${baseUrl}/${id}` : baseUrl
}

const FETCH_TIMEOUT_MS = 8000 // 8 segundos

// Función helper para crear una promesa con timeout
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: La petición tardó demasiado tiempo')), timeoutMs)
    )
  ])
}

export const apiRequest = async (url: string, options: RequestInit = {}, requireAuth: boolean = true) => {
  // Obtener token solo si es requerido
  let token: string | null = null
  if (requireAuth && typeof window !== 'undefined') {
    try {
      token = await tokenUtils.getToken()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting token for API request:', error)
      }
    }
  }
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetchWithTimeout(url, defaultOptions, FETCH_TIMEOUT_MS)
    
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }
      throw new Error('Error al procesar la respuesta del servidor')
    }
    
    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          await tokenUtils.removeToken()
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error removing token on 401:', error)
          }
        }
        
        if (typeof window.location !== 'undefined') {
          window.location.href = '/login'
        }
      }
      
      const errorMessage = data.message || data.detail || `Error: ${response.status}`
      throw new Error(errorMessage)
    }
    
    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Request Error:', error)
    }
    
    if (error instanceof Error) {
      // Mejorar mensajes de error según el tipo
      if (error.message.includes('Timeout') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.')
      }
      throw error
    }
    
    throw new Error('Error de conexión con el servidor')
  }
}
