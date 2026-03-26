import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Props {
  message: string
  onRetry: () => void
}

export function ErrorPanel({ message, onRetry }: Props) {
  return (
    <div className="flex items-center justify-center animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-black text-red-600">
            Error de Verificación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 text-center">
              {message}
            </p>
          </div>
          <div className="space-y-3">
          <Button 
            onClick={onRetry}
            className="w-full h-12 bg-primary hover:bg-primary/90 cursor-pointer"
          >
            Volver al Login
          </Button>
            <p className="text-xs text-center text-muted-foreground">
              Si el problema persiste, contacta a soporte
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

