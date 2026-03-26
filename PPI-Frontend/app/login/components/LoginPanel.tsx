"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

export const LoginPanel: React.FC = () => {
  const [error, setError] = useState("")
  const [isRegister, setIsRegister] = useState(false)

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm relative overflow-hidden">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-black text-primary">
          {isRegister ? "Registrarse" : "Iniciar Sesión"}
        </CardTitle>
        <CardDescription className="text-base">
          {isRegister
            ? "Crea tu cuenta para acceder a los mejores eventos"
            : "Accede a tu cuenta para gestionar tus entradas"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* Contenedor de slide */}
        <div className="overflow-hidden relative">
          <div
            className={`flex transition-transform duration-500 ease-in-out ${isRegister ? "-translate-x-full" : "translate-x-0"}`}
          >
            {/* LOGIN */}
            <div className="w-full flex-shrink-0">
              <LoginForm setIsRegister={setIsRegister} setError={setError} error={!isRegister ? error : ""} />
            </div>
            {/* REGISTER */}
            <div className="w-full flex-shrink-0">
              <RegisterForm setIsRegister={setIsRegister} setError={setError} error={isRegister ? error : ""} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
