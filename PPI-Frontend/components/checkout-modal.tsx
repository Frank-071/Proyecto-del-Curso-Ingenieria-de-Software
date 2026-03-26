"use client"

import { useState } from "react"
import { X, CreditCard, QrCode, Star, Gift, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useCartStore } from "@/lib/stores/cart-store"
import { useUserStore } from "@/lib/stores/user-store"
import { useClientPoints } from "@/lib/hooks/profile/use-client-points"
import { tokenUtils } from "@/lib/auth/token"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card")
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const { getTotalPrice, getGroupedByEvent, clearCart } = useCartStore()
  const { user, addPoints, usePoints: redeemPoints } = useUserStore()

  if (!isOpen || !user) return null

  const events = getGroupedByEvent()
  const subtotal = getTotalPrice()
  const rankDiscount = (subtotal * user.rankDiscount) / 100
  const pointsDiscount = pointsToUse * 0.1 // 1 punto = S/0.10
  const total = subtotal - rankDiscount - pointsDiscount

  const clientPoints = useClientPoints()

  const maxPointsToUse = Math.min(clientPoints.currentPoints, Math.floor(subtotal * 10)) // Máximo 100% del subtotal

  const handlePayment = async () => {
    setIsProcessing(true)

    const userId = await tokenUtils.getUserId()
    if (!userId) {
      toast.error('No hay sesión válida. Por favor, inicia sesión nuevamente.')
      setIsProcessing(false)
      return
    }

    // Simular procesamiento de pago
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (paymentMethod === "qr") {
      setShowQR(true)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    // Usar puntos si se seleccionó
    if (usePoints && pointsToUse > 0) {
      redeemPoints(pointsToUse)
    }

    // Agregar puntos por la compra (1 punto por cada S/5 gastado)
    const puntosAGanar = Math.floor(total / 5)
    console.log(`🔢 MODAL CALCULO PUNTOS: total=${total}, puntos=${puntosAGanar}`)
    addPoints(puntosAGanar)
      // Refrescar puntos desde el backend para mostrar saldo real actualizado
      try {
        await (clientPoints.reload && clientPoints.reload())
      } catch (e) {
        console.warn('No se pudo refrescar puntos tras el pago:', e)
      }

      clearCart(userId)
    setIsProcessing(false)
    onClose()

    // Mostrar notificación de éxito personalizada
    toast.success('¡Pago procesado exitosamente!', {
      description: `Has ganado ${Math.floor(total / 5)} puntos.`
    })
  }

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "platino":
        return <Crown className="h-4 w-4 text-purple-500" />
      case "oro":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "plata":
        return <Star className="h-4 w-4 text-gray-400" />
      default:
        return <Star className="h-4 w-4 text-amber-600" />
    }
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "platino":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "oro":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "plata":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Finalizar Compra</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumen de la compra */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resumen de tu compra</h3>
            {events.map((event) => (
              <div key={event.eventId} className="border rounded-lg p-4">
                <h4 className="font-medium">{event.eventName}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {event.eventDate} • {event.eventVenue}
                </p>
                {event.tickets.map((ticket) => (
                  <div key={ticket.id} className="flex justify-between text-sm">
                    <span>
                      {ticket.zone} x{ticket.quantity}
                    </span>
                    <span>S/{(ticket.price * ticket.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Estado del usuario */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getRankIcon(user.rank)}
                <span className="font-medium">Rango {user.rank.charAt(0).toUpperCase() + user.rank.slice(1)}</span>
                <Badge className={getRankColor(user.rank)}>{user.rankDiscount}% descuento</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Puntos disponibles</p>
                <p className="font-semibold">{clientPoints.currentPoints.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Canje de puntos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">Canjear puntos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="usePoints"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="usePoints">Usar mis puntos para descuento</Label>
            </div>
            {usePoints && (
              <div className="space-y-2">
                <Label htmlFor="pointsAmount">Cantidad de puntos (máximo {maxPointsToUse.toLocaleString()})</Label>
                <Input
                  id="pointsAmount"
                  type="number"
                  min="0"
                  max={maxPointsToUse}
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(Math.min(Number(e.target.value), maxPointsToUse))}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  Descuento: S/{(pointsToUse * 0.1).toFixed(2)} (1 punto = S/0.10)
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Método de pago */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Método de pago</h3>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "card" | "qr")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tarjeta de crédito/débito
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="qr" id="qr" />
                <Label htmlFor="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Código QR (Yape, Plin, BCP)
                </Label>
              </div>
            </RadioGroup>

            {paymentMethod === "card" && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="cardNumber">Número de tarjeta</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Fecha de vencimiento</Label>
                    <Input id="expiryDate" placeholder="MM/AA" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                    <Input id="cardName" placeholder="Juan Pérez" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "qr" && showQR && (
              <div className="flex flex-col items-center space-y-4 border rounded-lg p-6">
                <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Escanea este código QR con tu app de pagos favorita
                </p>
                <p className="font-semibold">Total a pagar: S/{total.toFixed(2)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Resumen de precios */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>S/{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Descuento por rango ({user.rankDiscount}%)</span>
              <span>-S/{rankDiscount.toFixed(2)}</span>
            </div>
            {usePoints && pointsToUse > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Descuento por puntos ({pointsToUse.toLocaleString()})</span>
                <span>-S/{pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>S/{total.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Ganarás {Math.floor(total / 5)} puntos con esta compra</p>
          </div>

          <Button onClick={handlePayment} className="w-full" size="lg" disabled={isProcessing}>
            {isProcessing ? "Procesando..." : `Pagar S/${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
