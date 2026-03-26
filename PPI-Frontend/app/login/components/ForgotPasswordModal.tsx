"use client"

import { useState } from "react"
import { authService } from "@/lib/api/services/auth"
import { validateEmail } from "@/lib/auth/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onOpenChange }) => {
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryError, setRecoveryError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handlePasswordRecovery = async () => {
    setRecoveryError("")
    
    const emailValidation = validateEmail(recoveryEmail)
    if (!emailValidation.isValid) {
      setRecoveryError(emailValidation.error!)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await authService.forgotPassword({ email: recoveryEmail })
      
      if (response.success) {
        setEmailSent(true)
      } else {
        setRecoveryError(response.message || "Error al enviar el correo")
      }
    } catch (error) {
      let errorMessage = "Hubo un error al procesar tu solicitud. Intenta nuevamente."
      
      if (error instanceof Error) {
        if (error.message.includes("No existe una cuenta")) {
          errorMessage = "No existe una cuenta asociada a este correo electrónico"
        } else if (error.message.includes("404") || error.message.includes("Not Found")) {
          errorMessage = "No se encontró una cuenta asociada a este correo"
        } else {
          errorMessage = error.message
        }
      }
      
      setRecoveryError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setEmailSent(false)
      setRecoveryEmail("")
      setRecoveryError("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] [&>button]:cursor-pointer">
        {!emailSent ? (
          <>
            <DialogHeader>
              <DialogTitle>Recuperar contraseña</DialogTitle>
              <DialogDescription>
                Ingresa tu correo para restablecer tu contraseña
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="recovery-email" className="text-sm font-medium">
                Correo electrónico
              </Label>
              <Input
                id="recovery-email"
                type="email"
                placeholder="Ingresa tu correo"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="mt-2"
              />
              {recoveryError && (
                <p className="text-sm text-red-500 mt-2">{recoveryError}</p>
              )}
            </div>
            <DialogFooter className="!flex-row !justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="cursor-pointer w-[140px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePasswordRecovery}
                disabled={isLoading}
                className="cursor-pointer w-[140px]"
              >
                {isLoading ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Correo enviado</DialogTitle>
              <DialogDescription>
                Se ha enviado un correo con las instrucciones para restablecer tu contraseña a <strong>{recoveryEmail}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada y haz clic en el enlace para cambiar tu contraseña.
              </p>
            </div>
            <DialogFooter className="!flex-row !justify-center">
              <Button
                onClick={() => handleClose(false)}
                className="cursor-pointer w-[140px]"
              >
                Aceptar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

