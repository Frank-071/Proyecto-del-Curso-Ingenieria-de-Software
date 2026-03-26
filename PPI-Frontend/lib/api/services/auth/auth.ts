import { apiRequest, buildApiUrl } from '../../config'

export interface LoginRequest {
  email: string
  contrasena: string
}

export interface RegisterRequest {
  email: string
  contrasena: string
  numero_documento: string
}

export interface UserIdRequest {
  user_id: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface PasswordResetResponse {
  success: boolean
  message: string
}

export interface AuthResponse {
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

export const authService = {
  // Login con backend real
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const url = buildApiUrl('/usuarios/login')
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  },

  // Registro con backend real
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const url = buildApiUrl('/usuarios/register')
    return await apiRequest(url, {
      method: 'POST', 
      body: JSON.stringify(userData)
    })
  },

  // Validar token de email
  async validateToken(token: string): Promise<AuthResponse> {
    const url = buildApiUrl(`/usuarios/verificar-token?token=${token}`)
    return await apiRequest(url, {
      method: 'GET'
    })
  },

  // Login después de verificación de email
  async loginAfterVerification(userData: UserIdRequest): Promise<AuthResponse> {
    const url = buildApiUrl('/usuarios/login-after-verification')
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  // Solicitar recuperación de contraseña
  async forgotPassword(data: ForgotPasswordRequest): Promise<PasswordResetResponse> {
    const url = buildApiUrl('/usuarios/forgot-password')
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Resetear contraseña con token
  async resetPassword(data: ResetPasswordRequest): Promise<PasswordResetResponse> {
    const url = buildApiUrl('/usuarios/reset-password')
    return await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Cerrar todas las sesiones
  async closeAllSessions(): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl('/usuarios/cerrar-todas-sesiones')
    return await apiRequest(url, {
      method: 'POST'
    })
  }
}

