"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { VerifyCodePanel } from "./VerifyCodePanel"
import { useAuth } from "@/lib/hooks/auth"

export function VerifyCodeClient() {
  const [code, setCode] = useState<string[]>(Array(6).fill(""))
  const [timer, setTimer] = useState(30)
  const [isDisabled, setIsDisabled] = useState(true)
  const [isAutoValidated, setIsAutoValidated] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginAfterVerification } = useAuth()

  // Protección: Verificar si hay un email en sessionStorage o parámetros de verificación
  useEffect(() => {
    const verified = searchParams.get('verified')
    const userId = searchParams.get('user_id')
    const email = sessionStorage.getItem('recoveryEmail')

    // Si viene de verificación de cuenta (registro)
    if (verified === 'true' && userId) {
      handleAutoLogin(parseInt(userId))
    } else if (verified === 'false') {
      toast.error("Error al verificar tu cuenta", {
        description: "Por favor intenta nuevamente o contacta al soporte."
      })
    } 
    // Si viene de recuperación de contraseña
    else if (email) {
      setRecoveryEmail(email)
    } 
    // Si no hay contexto válido, redirigir al login
    else {
      router.push('/login')
    }
  }, [searchParams, router])

  const handleAutoLogin = async (userId: number) => {
    try {
      const result = await loginAfterVerification(userId)
      
      if (result.success) {
        setIsAutoValidated(true)
        // El hook useAuth ya maneja la redirección a /admin o / según el rol
      } else {
        throw new Error(result.error || 'Respuesta inválida del servidor')
      }
    } catch (error) {
      toast.error("Error al iniciar sesión", {
        description: "Por favor intenta iniciar sesión manualmente."
      })
      router.push("/login")
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isDisabled && timer > 0 && !isAutoValidated) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      setIsDisabled(false)
      if (interval) clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timer, isDisabled, isAutoValidated])

  const handleResend = async () => {
    if (!recoveryEmail) {
      toast.error("No se encontró el correo de recuperación")
      return
    }

    try {
      // TODO: Implementar llamada al backend para reenviar código
      // await authService.resendRecoveryCode(recoveryEmail)
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setTimer(30)
      setIsDisabled(true)
      
      toast.success("Código reenviado", {
        description: `Se envió un nuevo código a ${recoveryEmail}`
      })
    } catch (error) {
      toast.error("Error al reenviar el código", {
        description: "Por favor intenta nuevamente."
      })
    }
  }

  const handleChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)
      if (value && index < code.length - 1) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const verificationCode = code.join("")
    
    if (verificationCode.length !== 6) {
      toast.error("Código incompleto", {
        description: "Por favor ingresa los 6 dígitos del código"
      })
      return
    }

    if (!recoveryEmail) {
      toast.error("No se encontró el correo de recuperación")
      return
    }

    try {
      // TODO: Implementar validación del código con el backend
      // await authService.verifyRecoveryCode(recoveryEmail, verificationCode)
      
      // Simular validación
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // ✅ Limpiar el sessionStorage después de verificar exitosamente
      sessionStorage.removeItem('recoveryEmail')
      
      toast.success("Código verificado correctamente", {
        description: `Verificado para: ${recoveryEmail}`
      })
      
      router.push("/")
    } catch (error) {
      toast.error("Código inválido", {
        description: "Por favor verifica e intenta nuevamente."
      })
    }
  }

  if (isAutoValidated) {
    return (
      <div className="flex items-center justify-center animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta Validada!</h2>
          <p className="text-gray-600 mb-4">Tu cuenta ha sido validada exitosamente y has iniciado sesión automáticamente.</p>
          <p className="text-sm text-blue-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
      <VerifyCodePanel
        code={code}
        timer={timer}
        isDisabled={isDisabled}
        onChange={handleChange}
        onResend={handleResend}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
