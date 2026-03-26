import { Separator } from "@/components/ui/separator"

interface PaymentSummaryProps {
  subtotal: number
  rankDiscount: number
  userRankDiscount: number
  usePoints: boolean
  pointsToUse: number
  pointsDiscount: number
  total: number
}

export function PaymentSummary({
  subtotal,
  rankDiscount,
  userRankDiscount,
  usePoints,
  pointsToUse,
  pointsDiscount,
  total,
}: PaymentSummaryProps) {
  return (
    <div className="border rounded-lg p-3 sm:p-4 space-y-2">
      <h3 className="font-semibold mb-3 text-sm sm:text-base">Resumen de pago</h3>
      <div className="flex justify-between text-xs sm:text-sm">
        <span>Subtotal</span>
        <span className="whitespace-nowrap">S/{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-green-600 text-xs sm:text-sm">
        <span className="break-words pr-2">Descuento por rango ({userRankDiscount}%)</span>
        <span className="whitespace-nowrap">-S/{rankDiscount.toFixed(2)}</span>
      </div>
      {usePoints && pointsToUse > 0 && (
        <div className="flex justify-between text-blue-600 text-xs sm:text-sm">
          <span className="break-words pr-2">Descuento por puntos ({pointsToUse.toLocaleString()})</span>
          <span className="whitespace-nowrap">-S/{pointsDiscount.toFixed(2)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between text-base sm:text-lg font-semibold">
        <span>Total</span>
        <span className="whitespace-nowrap">S/{total.toFixed(2)}</span>
      </div>
      {total > 0 && (
        <p className="text-xs sm:text-sm font-bold text-primary bg-primary/10 p-2 rounded">
          Ganarás {Math.floor(total / 5)} puntos con esta compra
        </p>
      )}
    </div>
  )
}
