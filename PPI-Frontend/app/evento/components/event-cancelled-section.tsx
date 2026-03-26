"use client"

import { memo } from "react"
import { AlertTriangle, Calendar, Clock, Loader2, Mail, MapPin, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { EventoResponse } from "@/lib/types/entities/evento"
import type { OrganizadorResponse } from "@/lib/types/entities/organizador"

interface EventCancelledSectionProps {
  evento: EventoResponse
  motivo?: string | null
  contacto: OrganizadorResponse | null
  loadingContacto: boolean
  errorContacto: string | null
  onRetryContacto: () => void
}

function EventCancelledSectionBase({
  evento,
  motivo,
  contacto,
  loadingContacto,
  errorContacto,
  onRetryContacto,
}: EventCancelledSectionProps) {
  const motivoTexto = motivo?.trim()
  const eventoExtendido = evento as (EventoResponse & {
    local_nombre?: string
    local_direccion?: string
    localInfo?: {
      nombre?: string
      direccion?: string
      distrito?: {
        nombre?: string
        provincia?: {
          nombre?: string
        }
      }
    }
  }) | null
  const eventDate = (() => {
    if (!evento?.fecha_hora_inicio) return null

    try {
      return new Date(evento.fecha_hora_inicio)
    } catch {
      return null
    }
  })()

  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Por confirmar"

  const formattedTime = eventDate
    ? eventDate.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Por confirmar"

  const venueName =
    evento?.local?.nombre || eventoExtendido?.local_nombre || eventoExtendido?.localInfo?.nombre || "Local por confirmar"

  const venueAddress = (() => {
    if (eventoExtendido?.local_direccion) return eventoExtendido.local_direccion
    if (evento?.local?.direccion) return evento.local.direccion
    if (eventoExtendido?.localInfo?.direccion) return eventoExtendido.localInfo.direccion

    const distrito = evento?.local?.distrito?.nombre || eventoExtendido?.localInfo?.distrito?.nombre
    const provincia =
      evento?.local?.distrito?.provincia?.nombre || eventoExtendido?.localInfo?.distrito?.provincia?.nombre

    if (distrito && provincia) {
      return `${distrito}, ${provincia}`
    }

    return "Dirección disponible próximamente"
  })()

  return (
    <section className="container mx-auto px-4">
      <Card className="border border-rose-200 bg-rose-50/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-rose-600" />
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Evento cancelado</p>
                <CardTitle className="text-2xl font-bold text-foreground">{evento.nombre}</CardTitle>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-rose-200 bg-white/80 p-4 shadow-xs sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</p>
                <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Horario</p>
                <p className="text-sm font-semibold text-foreground">{formattedTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lugar</p>
                <p className="text-sm font-semibold text-foreground">{venueName}</p>
                <p className="text-xs text-muted-foreground">{venueAddress}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-rose-200/60 bg-white/70 p-4 shadow-xs text-sm text-rose-900">
            Ya no es posible adquirir entradas ni acceder a la información original del evento. Revisa el motivo
            proporcionado por el organizador y los canales de contacto disponibles para gestionar tu reembolso.
          </div>

          <div className="rounded-lg border border-rose-200 bg-white/70 p-4 shadow-xs">
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
              Motivo de cancelación
            </p>
            <p className="mt-2 text-base text-rose-900">
              {motivoTexto && motivoTexto.length > 0
                ? motivoTexto
                : "El organizador no proporcionó un motivo específico para la cancelación."}
            </p>
          </div>

          <div className="grid gap-4 rounded-lg border border-muted bg-white/70 p-4 shadow-xs sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                ¿Qué hacer ahora?
              </p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>• Conserva tus comprobantes de compra y tus entradas digitales.</li>
                <li>• Comunícate con el organizador para coordinar el reembolso correspondiente.</li>
                <li>• Revisa tu bandeja de correo; recibirás una notificación con más instrucciones.</li>
              </ul>
            </div>

            <div className="rounded-md border border-muted-foreground/10 bg-muted/40 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Contacto del organizador
              </p>

              {loadingContacto ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando información de contacto...
                </div>
              ) : errorContacto ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-destructive">{errorContacto}</p>
                  <Button size="sm" variant="outline" className="w-fit" onClick={onRetryContacto}>
                    Reintentar
                  </Button>
                </div>
              ) : contacto ? (
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <div>
                    <p className="text-base font-semibold text-foreground">{contacto.nombre || "Organizador"}</p>
                  </div>
                  {contacto.correo && (
                    <p className="flex items-center gap-2 break-all">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href={`mailto:${contacto.correo}`} className="underline decoration-primary/40 hover:text-primary">
                        {contacto.correo}
                      </a>
                    </p>
                  )}
                  {contacto.telefono && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <a href={`tel:${contacto.telefono}`} className="underline decoration-primary/40 hover:text-primary">
                        {contacto.telefono}
                      </a>
                    </p>
                  )}
                  {!contacto.correo && !contacto.telefono && (
                    <p className="text-sm text-muted-foreground">
                      El organizador no ha proporcionado datos de contacto adicionales.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  El organizador aún no ha proporcionado información de contacto para este evento.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export const EventCancelledSection = memo(EventCancelledSectionBase)
