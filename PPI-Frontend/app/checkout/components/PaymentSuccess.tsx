import { Button } from "@/components/ui/button"

interface PaymentSuccessProps {
  total: number
  onGoHome: () => void
  onDownloadTickets: () => void
}

export function PaymentSuccess({ total, onGoHome, onDownloadTickets }: PaymentSuccessProps) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-green-600">¡Pago Exitoso!</h1>
      <p className="text-muted-foreground">
        Tu compra ha sido procesada correctamente.
        {total > 0 && ` Has ganado ${Math.floor(total / 5)} puntos.`}
      </p>
      <div className="space-y-3 pt-4">
        <Button onClick={onGoHome} className="w-full" size="lg">
          Volver al inicio
        </Button>
        <Button variant="outline" className="w-full bg-transparent" size="lg" onClick={onDownloadTickets}>
          Ver mis tickets
        </Button>
      </div>
    </div>
  )
}
