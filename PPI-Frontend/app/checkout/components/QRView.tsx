import { QrCode } from "lucide-react"

interface QRViewProps {
  total: number
}

export function QRView({ total }: QRViewProps) {
  return (
    <div className="flex flex-col items-center space-y-4 border rounded-lg p-6">
      <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
        <QrCode className="h-24 w-24 text-gray-400" />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Escanea este código QR con tu app de pagos favorita
      </p>
      <p className="font-semibold">Total a pagar: S/{total.toFixed(2)}</p>
      <p className="text-xs text-muted-foreground text-center">
        El pago se confirmará automáticamente una vez completado
      </p>
    </div>
  )
}
