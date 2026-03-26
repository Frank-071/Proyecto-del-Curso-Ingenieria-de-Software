"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CancelButton } from "@/components/ui/cancel-button"
import { useCartStore } from "@/lib/stores/cart-store"
import { useUserStore } from "@/lib/stores/user-store"
import { useBuyNowStore } from "@/lib/stores/buy-now-store"
import { useClientPoints } from "@/lib/hooks/profile/use-client-points"
import { useCheckout } from "../hooks/useCheckout"
import {
  CheckoutSummary,
  UserPointsCard,
  PointsRedemption,
  PaymentMethodSelector,
  CardForm,
  QRView,
  PaymentSummary,
  PaymentSuccess,
} from "."
import type { CartTicket, CartEvent } from "@/lib/stores/cart-store"

const CHECKOUT_TIMER_KEY = "checkout_expires_with_cart"
const TIME_DURATION_SECONDS = 600 // 10 minutos

export default function CheckoutClient() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card")
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [selectedSavedCard, setSelectedSavedCard] = useState<string>("")
  const [useNewCard, setUseNewCard] = useState(false)
  const [savePaymentMethodState, setSavePaymentMethodState] = useState(false)
  
  const [timeRemaining, setTimeRemaining] = useState(TIME_DURATION_SECONDS) 
  const [isExpired, setIsExpired] = useState(false)

  // Referencia para saber si es la primera vez que carga el componente
  const isMounted = useRef(false)

  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const { getTotalPrice, getGroupedByEvent } = useCartStore()
  const buyNowItems = useBuyNowStore((state) => state.items)
  const { user } = useUserStore()
  const clientPoints = useClientPoints()

  const checkoutMode = searchParams.get("mode")

  // Función auxiliar para agrupar tickets
  const groupTicketsByEvent = (tickets: CartTicket[]): CartEvent[] => {
    const grouped = tickets.reduce(
      (acc, item) => {
        if (!acc[item.eventId]) {
          acc[item.eventId] = {
            eventId: item.eventId,
            eventName: item.eventName,
            eventDate: item.eventDate,
            eventVenue: item.eventVenue,
            tickets: [],
            totalQuantity: 0,
            totalPrice: 0,
          }
        }
        acc[item.eventId].tickets.push(item)
        acc[item.eventId].totalQuantity += item.quantity
        acc[item.eventId].totalPrice += item.price * item.quantity
        return acc
      },
      {} as Record<string, CartEvent>
    )
    return Object.values(grouped)
  }

  const hasBuyNowItems = checkoutMode === "buy-now" && buyNowItems.length > 0
  const events = hasBuyNowItems ? groupTicketsByEvent(buyNowItems) : getGroupedByEvent()
  const subtotal = hasBuyNowItems
    ? buyNowItems.reduce((total, item) => total + item.price * item.quantity, 0)
    : getTotalPrice()

  // 1. Redirección si no hay usuario
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // --- CÁLCULOS SEGUROS ---
  const rankDiscount = user ? (subtotal * user.rankDiscount) / 100 : 0
  const pointsDiscount = pointsToUse * 0.1
  const total = Math.max(0, subtotal - rankDiscount - pointsDiscount)
  const totalAfterRankDiscount = subtotal - rankDiscount

  const maxPointsToUse = Math.min(
    clientPoints.currentPoints || 0,
    Math.floor(totalAfterRankDiscount * 10)
  )

  /**
   * 2. LÓGICA DEL TEMPORIZADOR (Persistencia Global)
   */
  useEffect(() => {
    // Si no hay eventos, limpiar el storage y salir
    // Esto asegura que si borras todo, el próximo timer será nuevo.
    if (!events || events.length === 0) {
      setTimeRemaining(TIME_DURATION_SECONDS)
      setIsExpired(false)
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(CHECKOUT_TIMER_KEY)
      }
      return
    }

    setIsExpired(false)
    const now = Date.now()

    // Generar Firma Única del Carrito
    // Ordenamos para que el orden visual no afecte la lógica (A+B es igual a B+A)
    const sortedItems = [...events].sort((a, b) => 
      a.eventId.toString().localeCompare(b.eventId.toString())
    )
    
    // Creamos la "Huella Digital" del carrito
    const currentCartKey = JSON.stringify({
      mode: checkoutMode ?? "cart",
      items: sortedItems.map((e) => ({
        id: e.eventId,
        q: e.totalQuantity,
        p: e.totalPrice, // Si cambia el precio, es un carrito nuevo
      })),
    })

    let expiresAt = now + (TIME_DURATION_SECONDS * 1000)

    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem(CHECKOUT_TIMER_KEY)

      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { cartKey: string; expiresAt: number }

          // LÓGICA DE PERSISTENCIA:
          // Si la firma del carrito es IDÉNTICA a la guardada Y el tiempo no ha expirado:
          // -> Respetamos el tiempo guardado (Persistencia al navegar).
          if (parsed.cartKey === currentCartKey && parsed.expiresAt > now) {
            expiresAt = parsed.expiresAt
          } 
          // Si la firma es DIFERENTE (agregaste/quitaste items) O el tiempo ya pasó:
          // -> Se queda con el valor por defecto (Nuevo Timer) y se sobrescribe abajo.
        } catch {
          // Error de lectura -> Nuevo Timer
        }
      }
      
      // Guardamos/Actualizamos el estado del timer
      window.sessionStorage.setItem(
        CHECKOUT_TIMER_KEY,
        JSON.stringify({ cartKey: currentCartKey, expiresAt })
      )
    }

    const updateRemaining = () => {
      const nowInner = Date.now()
      const diffMs = expiresAt - nowInner
      const remaining = Math.max(0, Math.floor(diffMs / 1000))

      setTimeRemaining(remaining)

      if (remaining <= 0) {
        setIsExpired(true)
      }
    }

    updateRemaining()
    const id = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(id)
  }, [events, checkoutMode]) 

  const { isProcessing, showQR, paymentCompleted, startPayment } = useCheckout({
    events,
    total,
    subtotal,
    usePoints,
    pointsToUse,
    paymentMethod,
    hasBuyNowItems,
    cardForm,
    useNewCard,
    savePaymentMethod: savePaymentMethodState,
    rankDiscount,
  })

  // Limpiar timer al completar pago
  useEffect(() => {
    if (!paymentCompleted) return
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(CHECKOUT_TIMER_KEY)
    }
  }, [paymentCompleted])

  if (!user) {
    return null 
  }

  // --- Funciones de renderizado ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSavedCardSelect = (cardId: string) => {
    setSelectedSavedCard(cardId)
    setUseNewCard(false)
  }

  const handleViewTickets = () => {
    router.push("/tickets")
  }

  if (paymentCompleted) {
    return (
      <PaymentSuccess
        total={total}
        onGoHome={() => router.push("/")}
        onDownloadTickets={handleViewTickets}
      />
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
      <div className="max-w-4xl mx-auto">
        {/* TIMER */}
        <div className="flex items-center justify-end mb-4 sm:mb-6">
          <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm ${
            timeRemaining <= 0 || isExpired ? "bg-red-100 text-red-700" : 
            timeRemaining < 120 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
          }`}>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">Tiempo: {formatTime(timeRemaining)}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Finalizar Compra</h1>

        {isExpired && (
          <div className="mb-4 sm:mb-6 rounded-lg border border-red-200 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-red-700">
            Tiempo agotado. Vuelve a la página del evento.
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Izquierda */}
          <div className="space-y-4 sm:space-y-6">
            <CheckoutSummary events={events} />
            <UserPointsCard rank={user.rank} rankDiscount={user.rankDiscount} currentPoints={clientPoints.currentPoints} />
            <PointsRedemption usePoints={usePoints} pointsToUse={pointsToUse} maxPointsToUse={maxPointsToUse} onUsePointsChange={setUsePoints} onPointsAmountChange={setPointsToUse} />
          </div>

          {/* Derecha */}
          <div className="space-y-4 sm:space-y-6">
            <PaymentMethodSelector paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} />
            
            {paymentMethod === "card" && (
              <CardForm
                savedPaymentMethods={user.savedPaymentMethods}
                selectedSavedCard={selectedSavedCard}
                useNewCard={useNewCard}
                cardForm={cardForm}
                savePaymentMethod={savePaymentMethodState}
                onSavedCardSelect={handleSavedCardSelect}
                onUseNewCard={() => { setUseNewCard(true); setSelectedSavedCard("") }}
                onCardFormChange={(f, v) => setCardForm(prev => ({ ...prev, [f]: v }))}
                onSavePaymentMethodChange={setSavePaymentMethodState}
              />
            )}

            {paymentMethod === "qr" && showQR && <QRView total={total} />}

            <PaymentSummary subtotal={subtotal} rankDiscount={rankDiscount} userRankDiscount={user.rankDiscount} usePoints={usePoints} pointsToUse={pointsToUse} pointsDiscount={pointsDiscount} total={total} />

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-2">
              <CancelButton
                type="button"
                className="w-full sm:w-48 h-10 text-sm font-medium"
                onClick={() => router.back()}
                disabled={isProcessing}
              />
              <Button
                type="button"
                size="lg"
                onClick={startPayment}
                className="w-full sm:w-48 cursor-pointer"
                disabled={isProcessing || total <= 0 || isExpired}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {paymentMethod === "qr" && !showQR ? "Generando QR..." : "Procesando..."}
                  </span>
                ) : (
                  `Pagar S/${total.toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



