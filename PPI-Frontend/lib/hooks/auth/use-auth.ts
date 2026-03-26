"use client"

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { tokenUtils } from '@/lib/auth/token'
import { type UseAuthReturn } from '@/lib/types/auth/auth'

export const useAuth = (): UseAuthReturn => {
  const router = useRouter()

  const login = useAuthStore(state => state.login)
  const loginAfterVerification = useAuthStore(state => state.loginAfterVerification)
  const logout = useAuthStore(state => state.logout)
  const isLoading = useAuthStore(state => state.isLoading)
  const error = useAuthStore(state => state.error)
  const setError = useAuthStore(state => state.setError)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const userInfo = useAuthStore(state => state.userInfo)

  return {
    login: async (email: string, password: string, redirectTo?: string | null) => {
      const result = await login(email, password)
      if (result.success) {
        const token = await tokenUtils.getToken()
        if (token) {
          const payload = tokenUtils.decodeJWT(token)
          const isAdmin = payload?.role === 'admin'
          const destination = redirectTo && redirectTo.trim().length > 0
            ? redirectTo
            : isAdmin ? '/admin' : '/'
          router.push(destination)
          setTimeout(() => {
            useAuthStore.setState({ isLoading: false })
          }, 300)
        }
      }
      return result
    },
    loginAfterVerification: async (userId: number) => {
      const result = await loginAfterVerification(userId)
      if (result.success) {
        const token = await tokenUtils.getToken()
        if (token) {
          const payload = tokenUtils.decodeJWT(token)
          const isAdmin = payload?.role === 'admin'
          router.push(isAdmin ? '/admin' : '/')
          setTimeout(() => {
            useAuthStore.setState({ isLoading: false })
          }, 300)
        }
      }
      return result
    },
    logout: async () => {
      await logout()
      router.push('/')
    },
    isLoading,
    error,
    setError,
    isAuthenticated,
    userInfo,
  }
}

