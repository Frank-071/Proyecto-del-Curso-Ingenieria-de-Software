"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, MapPin, Calendar, Tag, AlertCircle } from "lucide-react"
import { formatearFecha, obtenerCategoria } from "@/lib/utils/evento-utils"
import { useCartStore } from "@/lib/stores/cart-store"
import type { CartTicket } from "@/lib/stores/cart-store"
import { useBuyNowStore } from "@/lib/stores/buy-now-store"
import { useIsAuthenticated } from "@/lib/stores/auth-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useToast } from "@/components/ui/use-toast"
import { useEntradaLimite } from "@/lib/hooks/eventos"

interface TicketType {
  zona_id?: number
  // Algunos endpoints devuelven `id` en vez de `zona_id`
  id?: number
  nombre: string
  precio: number
  entradas_disponible: number
  descripcion: string
}

function useZonasEvento(
  eventoId?: number,
): { zonas: TicketType[]; loading: boolean; error: string | null } {
  const [zonas, setZonas] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventoId) return
    setLoading(true)
    setError(null)
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      }/zonas/evento/${eventoId}`,
    )
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.success !== false && Array.isArray(data.data)) {
          setZonas(data.data)
        } else if (data && Array.isArray(data)) {
          setZonas(data)
        } else {
          setZonas([])
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Error al cargar zonas")
        setLoading(false)
      })
  }, [eventoId])

  return { zonas, loading, error }
}

export function TicketSelector({ evento }: { evento?: any }) {
  const { toast } = useToast()

  const eventoId = evento?.evento_id ?? evento?.id
  const { zonas, loading: loadingZonas } = useZonasEvento(eventoId)

  const getZoneKey = (z: TicketType) => String(z.zona_id ?? z.id ?? z.nombre)

  const initialQuantities = useMemo(() => {
    const q: Record<string, number> = {}
    if (zonas && zonas.length > 0) {
      zonas.forEach((z) => {
        q[getZoneKey(z)] = 0
      })
    }
    return q
  }, [zonas])

  const [quantities, setQuantities] = useState<Record<string, number>>(
    initialQuantities,
  )

  const { addToCart, getRemainingTickets, getTotalItems } = useCartStore()
  const setBuyNowItems = useBuyNowStore((state) => state.setItems)
  const clearBuyNowItems = useBuyNowStore((state) => state.clear)
  const isLoggedIn = useIsAuthenticated()
  const router = useRouter()
  const userInfo = useAuthStore((state) => state.userInfo)
  const isAdmin = userInfo?.role === "admin"
  const userId = userInfo?.sub
  const remainingTickets = getRemainingTickets()
  const totalInCart = getTotalItems()

  const { limite, loading: loadingLimite } = useEntradaLimite(eventoId, isLoggedIn)

  const getMaxSelectableEntries = () => {
    if (isAdmin) return Infinity

    if (limite && limite.entradas_disponibles !== undefined) {
      return limite.entradas_disponibles
    }

    return 4 - totalInCart
  }

  const maxSelectable = getMaxSelectableEntries()

  const updateQuantity = (zonaKey: string, change: number) => {
    setQuantities((prev) => {
      const key = String(zonaKey)
      const current = prev[key] ?? 0
      const ticket = zonas.find((t) => getZoneKey(t) === key)
      if (!ticket) return prev

      const newQuantity = Math.max(0, current + change)

      if (newQuantity > ticket.entradas_disponible) {
        return prev
      }

      const currentTotalSelected = Object.entries(prev).reduce(
        (sum, [k, qty]) => sum + (k !== key ? (typeof qty === 'number' ? qty : 0) : 0),
        0
      )

      if (!isAdmin && currentTotalSelected + newQuantity > maxSelectable) {
        return prev
      }

      return { ...prev, [key]: newQuantity }
    })
  }

  // Total de entradas seleccionadas localmente (no en carrito)
  const getTotalSelectedItems = () => {
    return Object.values(quantities).reduce(
      (sum, qty) => sum + (typeof qty === "number" ? qty : 0),
      0,
    )
  }

  const getTotalPrice = () => {
    let total = 0
    for (const [zonaKey, cantidad] of Object.entries(quantities)) {
      if (typeof cantidad === "number" && cantidad > 0) {
        const ticket = zonas.find((t) => getZoneKey(t) === zonaKey)
        if (ticket) {
          total += ticket.precio * cantidad
        }
      }
    }
    return total
  }

  const totalSelected = getTotalSelectedItems()
  const hasReachedGlobalLimit = !isAdmin && totalSelected >= maxSelectable

  const addSelectedTicketsToCart = () => {
    clearBuyNowItems()
    if (!isLoggedIn || !userId) {
      router.push("/login")
      return false
    }

    let added = false
    Object.entries(quantities).forEach(([zonaKey, quantity]) => {
      if (quantity > 0) {
        const ticket = zonas.find((t) => getZoneKey(t) === zonaKey)
        if (ticket) {
          addToCart(
            {
              eventId: eventoId,
              eventName: evento?.nombre || "Evento",
              eventDate: evento?.fecha_hora_inicio || "",
              eventVenue:
                evento?.localInfo?.nombre || evento?.local?.nombre || "",
              zone: ticket.nombre,
              zoneId: ticket.zona_id ?? ticket.id,
              price: ticket.precio,
              quantity: quantity,
            },
            String(userId),
          )
          added = true
        }
      }
    })

    if (added) {
      setQuantities((prev) => {
        const newQuantities = { ...prev }
        Object.keys(prev).forEach((key) => {
          if (prev[key] > 0) newQuantities[key] = 0
        })
        return newQuantities
      })
    }

    return added
  }

  const handleAddToCart = () => {
    addSelectedTicketsToCart()
  }

  const handleBuyNow = () => {
    if (!isLoggedIn || !userId) {
      router.push("/login")
      return
    }

    const ticketsToCheckout: CartTicket[] = []
    Object.entries(quantities).forEach(([zonaKey, quantity], index) => {
      if (quantity > 0) {
        const ticket = zonas.find((t) => getZoneKey(t) === zonaKey)
        if (ticket) {
          ticketsToCheckout.push({
            id: `${String(eventoId ?? "")}-${ticket.nombre}-${Date.now()}-${index}`,
            eventId: String(eventoId ?? ""),
            eventName: evento?.nombre || "Evento",
            eventDate: evento?.fecha_hora_inicio || "",
            eventVenue:
              evento?.localInfo?.nombre || evento?.local?.nombre || "",
            zone: ticket.nombre,
            zoneId: ticket.zona_id ?? ticket.id,
            price: ticket.precio,
            quantity,
          })
        }
      }
    })

    if (ticketsToCheckout.length === 0) return

    setBuyNowItems(ticketsToCheckout)
    setQuantities((prev) => {
      const newQuantities = { ...prev }
      Object.keys(prev).forEach((key) => {
        if (prev[key] > 0) newQuantities[key] = 0
      })
      return newQuantities
    })

    router.push("/checkout?mode=buy-now")
  }

  return (
    <div className="w-full p-4 space-y-6">
      {/* Detalle del evento */}
      <div className="bg-card rounded-lg overflow-hidden">
        <div className="relative h-[600px] bg-gradient-to-r from-primary/20 to-accent/20">
          <img
            src={
              evento
                ? require("@/lib/utils/evento-utils").obtenerImagenEvento(evento)
                : "/concierto-rock-en-vivo-escenario-luces.jpg"
            }
            alt={evento?.nombre || "Evento"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-5xl font-extrabold mb-4">
              {evento?.nombre || "Festival Rock en Vivo 2026"}
            </h1>
            <div className="flex flex-wrap gap-6 text-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {evento?.fecha_hora_inicio
                    ? formatearFecha(evento.fecha_hora_inicio)
                    : "15 de Febrero, 2026 - 8:00 PM"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>
                  {evento?.localInfo?.nombre ||
                    evento?.local?.nombre ||
                    "Estadio Nacional, Lima"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <span>{evento ? obtenerCategoria(evento) : "Música • Rock"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="text-muted-foreground text-lg leading-relaxed">
            {evento?.descripcion || (
              <>
                Una noche épica con las mejores bandas de rock nacional e
                internacional. Disfruta de un espectáculo único con efectos
                especiales, pirotecnia y la mejor música en vivo en el escenario
                más grande del país.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Zonas / tipos de ticket */}
      <div className="space-y-6 pb-30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-3xl font-bold">Selecciona tus entradas</h2>
          {!isAdmin && totalInCart > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <Badge
                variant="secondary"
                className="bg-primary text-primary-foreground"
              >
                {totalInCart}/4
              </Badge>
              <span className="text-sm text-muted-foreground">
                {remainingTickets > 0
                  ? `${remainingTickets} ${remainingTickets === 1
                    ? "entrada disponible"
                    : "entradas disponibles"
                  }`
                  : "Límite alcanzado"}
              </span>
            </div>
          )}
        </div>

        {!loadingLimite && limite && limite.entradas_compradas > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-l-4 border-primary rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Ya tienes <span className="font-bold text-primary">{limite.entradas_compradas}</span> entrada{limite.entradas_compradas !== 1 ? 's' : ''} para este evento.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {limite.limite_alcanzado ? (
                    <span className="text-destructive font-medium">Has alcanzado el límite de 4 entradas por evento.</span>
                  ) : (
                    <>Puedes comprar hasta <span className="font-semibold text-primary">{limite.entradas_disponibles}</span> entrada{limite.entradas_disponibles !== 1 ? 's' : ''} más.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {loadingZonas ? (
          <div className="text-center py-8">Cargando zonas...</div>
        ) : zonas.length === 0 ? (
          <div className="text-center py-8">
            No hay zonas disponibles para este evento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {zonas.map((ticket) => {
              const key = getZoneKey(ticket)
              const currentQty = quantities[key] ?? 0

              return (
                <Card
                  key={key}
                  className="overflow-hidden w-full border-2 hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-semibold">
                            {ticket.nombre}
                          </h3>
                          <Badge variant="secondary" className="text-sm">
                            {ticket.entradas_disponible} disponibles
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-base mb-4">
                          {ticket.descripcion}
                        </p>
                        <div className="text-2xl font-bold text-primary">
                          S/ {ticket.precio}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(key, -1)}
                          disabled={isAdmin || !(currentQty > 0)}
                          className="h-10 w-10 p-0 cursor-pointer"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <div className="w-12 text-center font-medium text-lg">
                          {currentQty}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (hasReachedGlobalLimit) {
                              toast({
                                title: "Límite de entradas",
                                description:
                                  "Solo puedes seleccionar hasta 4 entradas por compra.",
                                variant: "destructive",
                              })
                              return
                            }
                            updateQuantity(key, 1)
                          }}
                          disabled={
                            isAdmin ||
                            currentQty >= ticket.entradas_disponible
                          }
                          className={`h-10 w-10 p-0 ${hasReachedGlobalLimit
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer"
                            }`}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    {/* Subtotal por zona */}
                    <div className="pt-2 text-right text-base text-primary font-semibold">
                      Subtotal: S/{" "}
                      {(currentQty * ticket.precio).toLocaleString("es-PE")}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen de selección */}
      {totalSelected > 0 && (
        <Card className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">
                  {totalSelected} entrada
                  {totalSelected !== 1 ? "s" : ""} seleccionada
                </div>
                <div className="text-2xl font-bold text-primary">
                  Total: S/ {getTotalPrice()}
                </div>
              </div>

              {!isAdmin ? (
                remainingTickets >= totalSelected ? (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto cursor-pointer"
                      onClick={handleBuyNow}
                    >
                      Comprar Ahora
                    </Button>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto cursor-pointer"
                      onClick={handleAddToCart}
                    >
                      Añadir al Carrito
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto opacity-60 cursor-not-allowed"
                      disabled
                    >
                      Límite de 4 entradas alcanzado
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ya tienes {totalInCart} entrada
                      {totalInCart !== 1 ? "s" : ""} en el carrito
                    </p>
                  </div>
                )
              ) : (
                <Button
                  size="lg"
                  className="w-full sm:w-auto opacity-60 cursor-not-allowed"
                  disabled
                >
                  Solo vista
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


