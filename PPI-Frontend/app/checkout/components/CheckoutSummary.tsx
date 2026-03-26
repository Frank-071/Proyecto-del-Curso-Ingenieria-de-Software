import type { CartEvent } from "@/lib/stores/cart-store"

interface CheckoutSummaryProps {
  events: CartEvent[]
}

function formatEventDateTime(dateString: string) {
  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    
    return `${day}/${month}/${year} • ${hours}:${minutes} ${ampm}`
  } catch {
    return dateString
  }
}

export function CheckoutSummary({ events }: CheckoutSummaryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold">Resumen de tu compra</h2>
      {events.map((event) => (
        <div key={event.eventId} className="border rounded-lg p-3 sm:p-4">
          <h3 className="font-medium mb-1 text-sm sm:text-base break-words">{event.eventName}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
            {event.eventVenue}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            {formatEventDateTime(event.eventDate)}
          </p>
          {event.tickets.map((ticket) => (
            <div key={ticket.id} className="flex justify-between text-xs sm:text-sm">
              <span className="break-words pr-2">
                {ticket.zone} x{ticket.quantity}
              </span>
              <span className="whitespace-nowrap">S/{(ticket.price * ticket.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
