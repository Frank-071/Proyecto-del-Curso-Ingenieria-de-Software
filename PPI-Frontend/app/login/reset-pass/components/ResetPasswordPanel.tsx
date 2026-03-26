"use client"

import { useState } from "react"
import { authService } from "@/lib/api/services/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, EyeOff } from "lucide-react"

interface Props {
  token: string
  onSuccess: () => void
}

export function ResetPasswordPanel({ token, onSuccess }: Props) {
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres"
    }
    if (!/[A-Z]/.test(password)) {
      return "La contraseña debe contener al menos una mayúscula"
    }
    if (!/[a-z]/.test(password)) {
      return "La contraseña debe contener al menos una minúscula"
    }
    if (!/[0-9]/.test(password)) {
      return "La contraseña debe contener al menos un número"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.resetPassword({
        token: token,
        new_password: password
      })
      
      if (response.success) {
        onSuccess()
      } else {
        setError(response.message || "Error al cambiar la contraseña")
      }
    } catch (error) {
      let errorMessage = "Error al cambiar la contraseña. Por favor intenta nuevamente."
      
      if (error instanceof Error) {
        if (error.message.includes("inválido") || error.message.includes("expirado")) {
          errorMessage = "El enlace ha expirado o es inválido. Por favor solicita un nuevo enlace desde el login."
        } else if (error.message.includes("404") || error.message.includes("Not Found")) {
          errorMessage = "El enlace de recuperación no es válido"
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-black text-primary">
            Recuperar contraseña
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Ingresa tu nueva contraseña a continuación
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeat-password" className="text-sm font-medium">
                Repite contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="repeat-password"
                  type={showRepeatPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Requisitos de contraseña */}
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p className="font-semibold">La contraseña debe contener:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Al menos 8 caracteres</li>
                <li>Una letra mayúscula</li>
                <li>Una letra minúscula</li>
                <li>Un número</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground animate-bounce-hover transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Cambiando contraseña..." : "Aceptar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

