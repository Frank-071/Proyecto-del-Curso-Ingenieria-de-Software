"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/auth"
import { SuccessPanel } from "./SuccessPanel"
import { ErrorPanel } from "./ErrorPanel"

export function VerificarCuentaClient() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginAfterVerification } = useAuth()

  useEffect(() => {
    const verified = searchParams.get('verified')
    const userId = searchParams.get('user_id')
    
    if (verified === 'true' && userId) {
      handleAutoLogin(parseInt(userId))
    } else if (verified === 'false') {
      setStatus('error')
      setErrorMessage('Token inválido o expirado. Por favor solicita un nuevo enlace de verificación.')
    } else {
      setStatus('error')
      setErrorMessage('Parámetros de verificación no encontrados.')
    }
  }, [searchParams])

  const handleAutoLogin = async (userId: number) => {
    try {
      const result = await loginAfterVerification(userId)
      
      if (result.success) {
        setStatus('success')
      } else {
        throw new Error(result.error || 'Respuesta inválida del servidor')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Error al iniciar sesión automáticamente')
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando tu cuenta...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return <SuccessPanel />
  }

  return <ErrorPanel message={errorMessage} onRetry={() => router.push('/login')} />
}
