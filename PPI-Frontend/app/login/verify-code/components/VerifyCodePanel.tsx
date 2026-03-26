import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"

interface Props {
  code: string[]
  timer: number
  isDisabled: boolean
  onChange: (value: string, index: number) => void
  onResend: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function VerifyCodePanel({ code, timer, isDisabled, onChange, onResend, onSubmit }: Props) {
  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm relative z-10">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-black text-primary flex items-center justify-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary" />
          Verificación
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Ingresa el código de 6 dígitos enviado a tu correo
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => onChange(e.target.value, index)}
                className="w-12 h-12 text-center text-lg font-bold border-2 border-black focus:border-primary rounded-md transition-colors"
                required
              />
            ))}
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground animate-bounce-hover transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            Confirmar código
          </Button>
        </form>
        <div className="text-sm text-center text-muted-foreground">
          {isDisabled ? (
            <p>
              Podrás reenviar el código en{" "}
              <span className="font-semibold">{timer}s</span>
            </p>
          ) : (
            <span
              onClick={onResend}
              className="text-primary hover:underline cursor-pointer font-semibold"
            >
              Reenviar código
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
