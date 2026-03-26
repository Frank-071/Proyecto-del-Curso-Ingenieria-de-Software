export interface JWTPayload {
  sub: number
  email: string
  role: string
  admin_type?: string
  exp: number
  iat?: number
}

export interface LoginCredentials {
  email: string
  contrasena: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user_id: number
    email: string
    role: string
    admin_type?: string
    expires_in?: number
    puntos_disponibles?: number
    puntos_historicos?: number
    rango?: string
    porcentaje_descuento?: number
  }
}

export interface AuthUser {
  id: string
  email: string
  role: string
  adminType?: string
}

export interface TokenResponse {
  token: string | null
}

export interface UseAuthReturn {
  login: (email: string, password: string, redirectTo?: string | null) => Promise<{ success: boolean; error?: string }>
  loginAfterVerification: (userId: number) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  error: string
  setError: (error: string) => void
  isAuthenticated: boolean
  userInfo: JWTPayload | null
}

export interface AuthState {
  isLoading: boolean
  error: string
  isAuthenticated: boolean
  userInfo: JWTPayload | null
  initialized: boolean

  initializeAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginAfterVerification: (userId: number) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  setError: (error: string) => void
}

