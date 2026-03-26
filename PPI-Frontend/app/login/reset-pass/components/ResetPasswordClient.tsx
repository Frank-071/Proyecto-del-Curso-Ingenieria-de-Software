"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ResetPasswordPanel } from "./ResetPasswordPanel"
import { SuccessModal } from "./SuccessModal"

export function ResetPasswordClient() {
  const [openModal, setOpenModal] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Leer y validar el token de la URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    
    if (!tokenFromUrl) {
      toast.error("Token no encontrado", {
        description: "Por favor solicita un nuevo enlace de recuperación."
      })
      router.push('/login')
      return
    }

    // TODO: Aquí validaremos con el backend si el token es válido
    // Por ahora solo guardamos el token
    setToken(tokenFromUrl)
    setIsValidating(false)
  }, [searchParams, router])

  const handleSuccess = () => {
    setOpenModal(true)
  }

  const handleGoToLogin = () => {
    setOpenModal(false)
    router.push("/login")
  }

  // Mientras validamos, no mostramos nada (o un loading)
  if (isValidating || !token) {
    return null
  }

  return (
    <>
      <div className="flex items-center justify-center animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
        <ResetPasswordPanel token={token} onSuccess={handleSuccess} />
      </div>
      <SuccessModal open={openModal} onOpenChange={setOpenModal} onGoToLogin={handleGoToLogin} />
    </>
  )
}
