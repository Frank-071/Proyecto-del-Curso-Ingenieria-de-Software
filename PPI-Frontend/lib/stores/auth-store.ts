"use client"

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { authService } from '@/lib/api/services/auth'
import { tokenUtils } from '@/lib/auth/token'
import { useUserStore } from '@/lib/stores/user-store'
import { type UserRank } from '@/lib/types/auth'
import { type AuthState, type LoginResponse, type JWTPayload } from '@/lib/types/auth'

const syncUserAfterLogin = (
  response: LoginResponse,
  payload: JWTPayload,
  set: (partial: Partial<AuthState>) => void
) => {
  const isAdmin = payload.role === 'admin'
  const rango: UserRank = (response.data.rango as UserRank) || (isAdmin ? "platino" : "bronce")
  const descuento = response.data.porcentaje_descuento || (isAdmin ? 25 : 0)

  // No establecemos isLoading: false aquí para mantener el estado de carga durante la redirección
  set({
    isAuthenticated: true,
    userInfo: payload
  })

  useUserStore.getState().setUser({
    id: payload.sub.toString(),
    name: isAdmin ? "Administrador" : "Cliente",
    email: payload.email,
    currentPoints: response.data.puntos_disponibles || 0,
    totalPointsEarned: response.data.puntos_historicos || 0,
    rank: rango,
    rankDiscount: descuento,
    savedPaymentMethods: [],
    purchasedTickets: [],
  })
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      isLoading: false,
      error: '',
      isAuthenticated: false,
      userInfo: null,
      initialized: false,

      initializeAuth: async () => {
        const { initialized } = get()
        if (initialized) return

        try {
          const token = await tokenUtils.getToken()

          if (token) {
            const isValid = await tokenUtils.validateToken(token)

            if (isValid) {
              const payload = tokenUtils.decodeJWT(token)

              if (payload) {
                set({
                  isAuthenticated: true,
                  userInfo: payload,
                  initialized: true
                })

                return
              }
            }

            await tokenUtils.removeToken()
          }
        } catch (error) {

        }

        set({ initialized: true })
      },

      login: async (email: string, password: string) => {
        set({ error: '', isLoading: true })

        try {
          const response = await authService.login({
            email,
            contrasena: password
          })

          if (response.success && response.data.token) {
            await tokenUtils.setToken(response.data.token)

            const payload = tokenUtils.decodeJWT(response.data.token)

            if (payload) {
              syncUserAfterLogin(response, payload, set)
              return { success: true }
            }
          }

          const errorMsg = response.message || 'Error al iniciar sesión'
          set({ error: errorMsg, isLoading: false })
          return { success: false, error: errorMsg }

        } catch (error) {
          const errorMessage = (error as Error).message || 'Error de conexión'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      loginAfterVerification: async (userId: number) => {
        set({ error: '', isLoading: true })

        try {
          const response = await authService.loginAfterVerification({ user_id: userId })

          if (response.success && response.data.token) {
            await tokenUtils.setToken(response.data.token)

            const payload = tokenUtils.decodeJWT(response.data.token)

            if (payload) {
              syncUserAfterLogin(response, payload, set)
              return { success: true }
            }
          }

          const errorMsg = response.message || 'Error al iniciar sesión después de verificación'
          set({ error: errorMsg, isLoading: false })
          return { success: false, error: errorMsg }

        } catch (error) {
          const errorMessage = (error as Error).message || 'Error de conexión'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        await tokenUtils.removeToken()

        set({
          isAuthenticated: false,
          userInfo: null,
          error: '',
          initialized: false
        })

        useUserStore.getState().logout()
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-store-v2', // Incrementado para forzar reset de datos corruptos
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useUserInfo = () => useAuthStore(state => state.userInfo)

