"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/auth"
import { validateEmail } from "@/lib/auth/validators"
import { ForgotPasswordModal } from "./ForgotPasswordModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react"

interface Props {
  setIsRegister: (v: boolean) => void
  setError: (v: string) => void
  error: string
}

export const LoginForm: React.FC<Props> = ({ setIsRegister, setError, error }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [forgotOpen, setForgotOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setError(emailValidation.error!)
      return
    }

    const returnUrlParam = searchParams.get('returnUrl')
    const destination = returnUrlParam ? decodeURIComponent(returnUrlParam) : null

    const result = await login(email, password, destination)
    if (result.success) {
      if (destination) {
        router.push(destination)
      }
    } else if (result.error) {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex-shrink-0 space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email-login" className="text-sm font-medium">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email-login"
            type="email"
            placeholder="Ingresa tu correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 border-2 focus:border-primary transition-colors"
            required
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-login" className="text-sm font-medium">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password-login"
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-colors"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="eye-toggle-button absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            id="remember-login"
            type="checkbox"
            className="w-4 h-4 text-primary bg-background border-2 border-border rounded focus:ring-primary focus:ring-2"
            disabled={isLoading}
          />
          <Label htmlFor="remember-login" className="text-sm text-muted-foreground">Recordarme</Label>
        </div>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setForgotOpen(true)
          }}
          className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
      </div>
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          "Iniciar Sesión"
        )}
      </Button>
      <Button
        variant="outline"
        onClick={() => router.push("/")}
        className="secondary-button w-full h-12 text-base font-semibold transition-all duration-200 cursor-pointer"
      >
        Volver
      </Button>
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <span
            onClick={() => { setError(""); setIsRegister(true) }}
            className="cursor-pointer text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Regístrate aquí
          </span>
        </p>
      </div>
    </form>
  )
}
