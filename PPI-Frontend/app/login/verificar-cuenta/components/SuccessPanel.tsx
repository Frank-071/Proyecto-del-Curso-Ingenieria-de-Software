"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function SuccessPanel() {
  return (
    <div className="flex items-center justify-center animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-black text-primary">
            ¡Cuenta Validada!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-muted-foreground text-base">
            Tu cuenta ha sido validada exitosamente y has iniciado sesión automáticamente.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span>Redirigiendo...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

