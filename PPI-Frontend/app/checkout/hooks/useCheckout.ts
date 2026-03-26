import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/lib/stores/user-store"
import { useCartStore } from "@/lib/stores/cart-store"
import { useBuyNowStore } from "@/lib/stores/buy-now-store"
import { useClientPoints } from "@/lib/hooks/profile/use-client-points"
import { useEntradas } from "@/lib/hooks/eventos"
import { toast } from "sonner"
import type { CartEvent } from "@/lib/stores/cart-store"

interface UseCheckoutProps {
  events: CartEvent[]
  total: number
  subtotal: number
  usePoints: boolean
  pointsToUse: number
  paymentMethod: "card" | "qr"
  hasBuyNowItems: boolean
  cardForm: {
    cardNumber: string
    expiryDate: string
    cvv: string
    cardName: string
  }
  useNewCard: boolean
  savePaymentMethod: boolean
  rankDiscount: number  // Agregar descuento por rango
}

export function useCheckout({
  events,
  total,
  subtotal,
  usePoints,
  pointsToUse,
  paymentMethod,
  hasBuyNowItems,
  cardForm,
  useNewCard,
  savePaymentMethod,
  rankDiscount,
}: UseCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { user, addPoints, usePoints: redeemPoints, savePaymentMethod: savePayment, addPurchasedTickets } = useUserStore()
  const { clearCart } = useCartStore()
  const clearBuyNowItems = useBuyNowStore((state) => state.clear)
  const clientPoints = useClientPoints()
  const { crearEntradasBulkMulti } = useEntradas()

  const startPayment = async () => {
    if (total <= 0 || !user) {
      setError("Total inválido o usuario no autenticado")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Simulación de procesamiento según método de pago
      if (paymentMethod === "qr") {
        setShowQR(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await new Promise((resolve) => setTimeout(resolve, 3000))
      } else {
        if (savePaymentMethod && useNewCard && cardForm.cardNumber && cardForm.cardName) {
          const maskedCardNumber = `**** **** **** ${cardForm.cardNumber.slice(-4)}`
          savePayment({
            type: "card",
            cardNumber: maskedCardNumber,
            cardHolder: cardForm.cardName,
            expiryDate: cardForm.expiryDate,
            isDefault: user.savedPaymentMethods.length === 0,
          })
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Validar todas las zonas antes de procesar
      const invalid = events
        .flatMap((ev) => ev.tickets)
        .filter((t) => !Number.isInteger(Number((t as any).zoneId)) || Number((t as any).zoneId) <= 0)
      
      if (invalid.length > 0) {
        throw new Error("Algunas entradas del carrito no tienen zona válida. Vacía el carrito y vuelve a añadir las entradas.")
      }

      // Calcular total de entradas y descuento
      const totalEntradasCheckout = events.reduce(
        (total, ev) => total + ev.tickets.reduce((sum, t) => sum + Math.max(1, Number(t.quantity) || 1), 0),
        0
      )
      const descuentoPuntos = usePoints && pointsToUse > 0 ? pointsToUse * 0.1 : 0

      // Preparar payload para bulk-multi endpoint
      const items = events.flatMap((ev) =>
        ev.tickets.map((t) => ({
          zona_id: Number((t as any).zoneId),
          cantidad: Math.max(1, Number(t.quantity) || 1),
        }))
      )

      // Llamar al nuevo endpoint bulk-multi (1 sola petición)
      const result = await crearEntradasBulkMulti({
        items,
        total_entradas_checkout: totalEntradasCheckout,
        descuento_total: descuentoPuntos,
        puntos_canjeados: usePoints && pointsToUse > 0 ? pointsToUse : 0,
        payment_method: paymentMethod,
        metodo_pago_id: paymentMethod === "card" ? 1 : 2,
        descuento_rango: rankDiscount,
      })

      if (!result.success) {
        throw new Error(result.detail || "Error al crear entradas")
      }

      // El backend ya envía el correo en background, no necesitamos hacerlo desde el frontend

      // Actualizar puntos locales (zustand)
      if (usePoints && pointsToUse > 0) {
        redeemPoints(pointsToUse)
      }

      if (total > 0) {
        const puntosAGanar = Math.floor(total / 5)
        addPoints(puntosAGanar)
      }

      // Añadir tickets comprados al perfil local
      const purchasedTickets = events.flatMap((event) =>
        event.tickets.map((ticket) => ({
          eventId: event.eventId,
          eventName: event.eventName,
          eventDate: new Date(event.eventDate),
          eventImage: "/concierto-rock-en-vivo-escenario-luces.jpg",
          ticketType: ticket.zone.split(" ")[1] || ticket.zone,
          zone: ticket.zone,
          quantity: ticket.quantity,
          price: ticket.price * ticket.quantity,
          purchaseDate: new Date(),
          isUsed: false,
          canTransfer: true,
        }))
      )
      addPurchasedTickets(purchasedTickets)

      // Refrescar puntos reales desde backend (en background, no bloquear)
      clientPoints.reload?.().catch((e) => {
        console.warn("No se pudo refrescar puntos tras el pago:", e)
      })

      // Limpiar carrito según modo de checkout
      if (hasBuyNowItems) {
        // Modo "Comprar Ahora": limpiar solo el store temporal
        clearBuyNowItems()
      } else {
        // Modo carrito normal: limpiar el carrito persistente
        if (user?.id) {
          clearCart(String(user.id))
        }
      }

      setPaymentCompleted(true)
    } catch (err) {
      console.error("Error en checkout:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al procesar el pago"
      
      // Mostrar mensaje de error amigable según el tipo
      if (errorMessage.includes("zona válida")) {
        toast.error("Error en el carrito", {
          description: "Algunas entradas no son válidas. Por favor, vacía el carrito y vuelve a seleccionar tus entradas."
        })
      } else if (errorMessage.includes("suficientes entradas")) {
        toast.error("Entradas agotadas", {
          description: "Lo sentimos, no hay suficientes entradas disponibles. Por favor, selecciona menos entradas."
        })
      } else if (errorMessage.includes("puntos")) {
        toast.error("Error con puntos", {
          description: "No tienes suficientes puntos disponibles. Verifica tu saldo e intenta nuevamente."
        })
      } else {
        toast.error("Error al procesar la compra", {
          description: "Ocurrió un problema al procesar tu compra. Por favor, intenta nuevamente."
        })
      }
      
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    isProcessing,
    showQR,
    paymentCompleted,
    error,
    startPayment,
  }
}
