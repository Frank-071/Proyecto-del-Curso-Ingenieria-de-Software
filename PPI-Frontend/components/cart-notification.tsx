"use client"

import { useCartNotificationStore } from "@/lib/stores/cart-notification-store"
import { ShoppingCart, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CartNotification() {
  const notifications = useCartNotificationStore(state => state.notifications)
  const removeNotification = useCartNotificationStore(state => state.removeNotification)

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            pointer-events-auto
            bg-card border-2 border-primary shadow-2xl rounded-lg p-4 min-w-[320px] max-w-md
            transform transition-all duration-300 ease-out
            ${notification.visible 
              ? 'translate-x-0 opacity-100 scale-100' 
              : 'translate-x-[400px] opacity-0 scale-95'
            }
          `}
        >
          <div className="flex items-start gap-3">
            {/* Icono animado */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary rounded-full p-2 animate-bounce-in">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="font-semibold text-sm">Agregado al carrito</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {notification.eventName}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{notification.zone}</span>
                  <span className="font-medium">x{notification.quantity}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <span className="text-sm font-bold text-primary">
                    S/ {(notification.price * notification.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full animate-shrink-width"
              style={{ 
                animation: 'shrinkWidth 3s linear forwards'
              }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-shrink-width {
          animation: shrinkWidth 3s linear forwards;
        }
        .animate-bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  )
}

