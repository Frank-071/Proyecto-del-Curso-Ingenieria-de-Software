"use client";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Minus, Plus, Calendar, MapPin, CreditCard, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEffect } from "react";

export function CartSidebar() {
  const router = useRouter();
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const getGroupedByEvent = useCartStore((s) => s.getGroupedByEvent);
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const loadCart = useCartStore((s) => s.loadCart);
  const clearCart = useCartStore((s) => s.clearCart);

  const userInfo = useAuthStore((s) => s.userInfo);
  const userId = userInfo?.sub;

  // Cargar carrito al montar el componente
  useEffect(() => {
    if (!userId) return;
    loadCart(String(userId));
  }, [userId, loadCart]);

  // Limpiar carrito si se cierra sesión
  useEffect(() => {
    if (!userId) {
      clearCart("");
    }
  }, [userId, clearCart]);

  const groupedEvents = getGroupedByEvent();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const MAX_CART_TICKETS = 4;
  const isCartLimitReached = totalItems >= MAX_CART_TICKETS;

  const handleProceedToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[9999] transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border z-[9999] transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumen</p>
              <h2 className="text-xl font-semibold mt-1">
                Mi Carrito {totalItems > 0 && `(${totalItems})`}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={closeCart} className="cursor-pointer rounded-full hover:bg-primary/10">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {groupedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-medium mb-2">Tu carrito está vacío</p>
                  <p className="text-sm">Agrega entradas para comenzar tu compra</p>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                {groupedEvents.map((event) => (
                  <Card
                    key={event.eventId}
                    className="overflow-hidden rounded-2xl py-0 border border-primary/15 shadow-sm bg-gradient-to-b from-primary/15 via-background to-background hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="px-5 py-3 border-b border-primary/10">
                      <h3 className="font-semibold text-base text-primary mb-2">{event.eventName}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span>{event.eventDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{event.eventVenue}</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-0 bg-transparent">
                      {event.tickets.map((ticket, index) => (
                        <div key={ticket.id}>
                          <div className="px-5 py-3">
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{ticket.zone}</span>
                                    <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/10">
                                      S/ {ticket.price}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Subtotal: <span className="font-semibold text-foreground">S/ {ticket.price * ticket.quantity}</span>
                                  </p>
                                </div>
                                <Badge className="bg-orange-500 text-white text-xs px-3 py-1 shadow-sm min-w-[88px] justify-center">
                                  {ticket.quantity} entrada{ticket.quantity !== 1 ? "s" : ""}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center border border-primary/30 rounded-full overflow-hidden bg-primary/10">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(ticket.id, ticket.quantity - 1, String(userId))}
                                    className="h-9 w-9 p-0 cursor-pointer hover:bg-primary/20"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <div className="w-10 text-center text-sm font-semibold text-transparent bg-gradient-to-r from-primary to-emerald-400 bg-clip-text">
                                    {ticket.quantity}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (isCartLimitReached) return;
                                      updateQuantity(ticket.id, ticket.quantity + 1, String(userId));
                                    }}
                                    className="h-9 w-9 p-0 cursor-pointer hover:bg-primary/20"
                                    disabled={isCartLimitReached}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(ticket.id, String(userId))}
                                  className="h-9 w-9 p-0 text-destructive hover:text-destructive cursor-pointer border border-destructive/20 rounded-full hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {index < event.tickets.length - 1 && <Separator />}
                        </div>
                      ))}

                      <div className="bg-gradient-to-r from-primary/10 to-transparent px-5 py-2 border-t border-primary/10">
                        <div className="flex justify-between items-center text-sm font-semibold text-primary">
                          <span>Total del evento</span>
                          <span className="text-foreground">S/ {event.totalPrice}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {totalItems > 0 && (
            <div className="border-t px-5 py-4 space-y-4 bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Detalles de pago
                </div>
              </div>

              <div className="bg-background rounded-xl border border-primary/10 px-4 py-3 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {totalItems} entrada{totalItems !== 1 ? "s" : ""}
                  </span>
                  <span className="font-medium text-foreground">S/ {totalPrice}</span>
                </div>
                <Separator className="bg-primary/20" />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total a pagar</span>
                  <span className="text-primary">S/ {totalPrice}</span>
                </div>
              </div>

              <Button
                className="w-full cursor-pointer h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md"
                size="lg"
                onClick={handleProceedToCheckout}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceder al Pago
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
