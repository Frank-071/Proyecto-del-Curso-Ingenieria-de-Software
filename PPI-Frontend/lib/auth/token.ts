import { type JWTPayload } from '@/lib/types/auth'

export const tokenUtils = {
  setToken: async (token: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      
      if (!response.ok) {
        throw new Error('Failed to set token')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error setting token:', error)
      }
      throw error
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/get-token')
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.token
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting token:', error)
      }
      return null
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await fetch('/api/auth/remove-token', { method: 'POST' })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing token:', error)
      }
    }
  },

  hasToken: async (): Promise<boolean> => {
    const token = await tokenUtils.getToken()
    return !!token
  },

  decodeJWT: (token: string): JWTPayload | null => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload) as JWTPayload
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error decoding JWT:', error)
      }
      return null
    }
  },


  isTokenExpired: (token: string): boolean => {
    const payload = tokenUtils.decodeJWT(token)
    if (!payload) return true
    
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  },

  validateToken: async (token?: string): Promise<boolean> => {
    const tokenToValidate = token || await tokenUtils.getToken()
    if (!tokenToValidate) return false
    
    return !tokenUtils.isTokenExpired(tokenToValidate)
  },

  validateTokenSync: (token: string): boolean => {
    if (!token) return false
    return !tokenUtils.isTokenExpired(token)
  },

  getUserFromToken: async (): Promise<JWTPayload | null> => {
    const token = await tokenUtils.getToken()
    if (!token || tokenUtils.isTokenExpired(token)) return null
    
    return tokenUtils.decodeJWT(token)
  },

  getUserId: async (): Promise<string | null> => {
    const userFromToken = await tokenUtils.getUserFromToken()
    return userFromToken ? userFromToken.sub.toString() : null
  }
}