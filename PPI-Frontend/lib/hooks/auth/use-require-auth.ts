import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { tokenUtils } from '@/lib/auth/token'

export const useRequireAuth = (requiredRole?: 'admin' | 'user') => {
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const validateAuth = async () => {
      // Verificar si hay token
      const token = await tokenUtils.getToken()
      if (!token || !(await tokenUtils.validateToken(token))) {
        router.push('/login')
        return
      }

      // Si se requiere un rol específico, verificar
      if (requiredRole) {
        const userInfo = await tokenUtils.getUserFromToken()
        if (!userInfo) {
          router.push('/login')
          return
        }

        if (requiredRole === 'admin' && userInfo.role !== 'admin') {
          router.push('/')
          return
        }
      }

      // Si llega aquí, está autorizado
      setIsValidating(false)
    }

    validateAuth()
  }, [router, requiredRole])

  return { isValidating }
}

// Hook específico para admin
export const useRequireAdmin = () => {
  return useRequireAuth('admin')
}

