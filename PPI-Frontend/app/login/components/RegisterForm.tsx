"use client"

import React, { useState } from "react"
import { authService } from "@/lib/api/services/auth"
import { validateEmail, validatePassword, validateDocument } from "@/lib/auth/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react"

interface Props {
  setIsRegister: (v: boolean) => void
  setError: (v: string) => void
  error: string
}

export const RegisterForm: React.FC<Props> = ({ setIsRegister, setError, error }) => {
  const [regDni, setRegDni] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regShowPassword, setRegShowPassword] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const passwordValidation = validatePassword(regPassword)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    const docValidation = validateDocument(regDni)
    if (!docValidation.isValid) {
      setError(docValidation.error!)
      setIsLoading(false)
      return
    }

    const emailValidation = validateEmail(regEmail)
    if (!emailValidation.isValid) {
      setError(emailValidation.error!)
      setIsLoading(false)
      return
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.error!)
      setIsLoading(false)
      return
    }
    
    try {
      const response = await authService.register({
        email: regEmail,
        contrasena: regPassword,
        numero_documento: regDni
      })
      
      if (response.success) {
        setRegEmail("")
        setRegPassword("")
        setRegDni("")
        setIsRegister(false)
        setShowVerification(true)
      } else {
        setError(response.message || "Error en el registro")
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Error conectando con el servidor. Intenta nuevamente.")
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleRegister} className="w-full flex-shrink-0 space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="dni-register" className="text-sm font-medium">DNI/Carné Extranjería</Label>
        <Input
          id="dni-register"
          type="text"
          placeholder="Ingresa tu Documento de Identidad"
          value={regDni}
          onChange={(e) => setRegDni(e.target.value)}
          className="h-12 border-2 focus:border-primary transition-colors"
          required
          maxLength={12}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-register" className="text-sm font-medium">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email-register"
            type="email"
            placeholder="Ingresa tu correo"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            className="pl-10 h-12 border-2 focus:border-primary transition-colors"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-register" className="text-sm font-medium">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password-register"
            type={regShowPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-colors"
            required
          />
          <button
            type="button"
            onClick={() => setRegShowPassword(!regShowPassword)}
            className="eye-toggle-button absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {regShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${passwordValidation.criteria?.hasMinLength ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`text-xs ${passwordValidation.criteria?.hasMinLength ? 'text-green-600' : 'text-muted-foreground'}`}>
              Mínimo 8 caracteres
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${passwordValidation.criteria?.hasUpperCase ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`text-xs ${passwordValidation.criteria?.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`}>
              Una mayúscula
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${passwordValidation.criteria?.hasLowerCase ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`text-xs ${passwordValidation.criteria?.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}`}>
              Una minúscula
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${passwordValidation.criteria?.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`text-xs ${passwordValidation.criteria?.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
              Un número
            </span>
          </div>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          "Crear Cuenta"
        )}
      </Button>
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verificación de cuenta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Hemos enviado un enlace de verificación a tu correo electrónico. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
          <DialogFooter>
            <Button
              onClick={() => setShowVerification(false)}
              className="cursor-pointer"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <span
            onClick={() => { setError(""); setIsRegister(false) }}
            className="cursor-pointer text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Inicia sesión aquí
          </span>
        </p>
      </div>
    </form>
  )
}
