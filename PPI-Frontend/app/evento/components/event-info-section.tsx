"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgePercent, ShoppingCart, MapPin, Clock, Calendar, QrCode, Users, AlertCircle } from "lucide-react"

interface EventInfoSectionProps {
  evento?: any
}

export function EventInfoSection({ evento }: EventInfoSectionProps) {
  const getFormattedDate = () => {
    if (!evento?.fecha_hora_inicio) return "Por confirmar"

    try {
      const date = new Date(evento.fecha_hora_inicio)
      return date.toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return "Por confirmar"
    }
  }

  const getStartTime = () => {
    if (!evento?.fecha_hora_inicio) return "Por confirmar"

    try {
      const startDate = new Date(evento.fecha_hora_inicio)
      return startDate.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return "Por confirmar"
    }
  }

  // Calcular duración del evento
  const getEventDuration = () => {
    if (!evento?.fecha_hora_inicio) return "Por confirmar"

    if (evento?.fecha_hora_fin) {
      try {
        const startDate = new Date(evento.fecha_hora_inicio)
        const endDate = new Date(evento.fecha_hora_fin)
        const diffMs = endDate.getTime() - startDate.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

        if (diffHours > 0 && diffMinutes > 0) {
          return `${diffHours} hora${diffHours !== 1 ? 's' : ''} y ${diffMinutes} minutos`
        } else if (diffHours > 0) {
          return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`
        } else if (diffMinutes > 0) {
          return `${diffMinutes} minutos`
        }
      } catch {
        return "2 horas (aprox.)"
      }
    }

    return "2 horas (aprox.)"
  }

  // Obtener información del local
  const getVenueName = () => {
    return evento?.local?.nombre ||
      evento?.localInfo?.nombre ||
      evento?.local_nombre ||
      "Local por confirmar"
  }

  const getVenueAddress = () => {
    // Primero intentar obtener la dirección del campo local_direccion (endpoint público de lista)
    if (evento?.local_direccion) {
      return evento.local_direccion
    }

    // Luego intentar obtener de las estructuras anidadas (endpoint de detalle)
    if (evento?.local?.direccion) {
      return evento.local.direccion
    }

    if (evento?.localInfo?.direccion) {
      return evento.localInfo.direccion
    }

    // Fallback: distrito y provincia si están disponibles
    const distrito = evento?.local?.distrito?.nombre || evento?.localInfo?.distrito?.nombre
    const provincia = evento?.local?.distrito?.provincia?.nombre || evento?.localInfo?.distrito?.provincia?.nombre

    if (distrito && provincia) {
      return `${distrito}, ${provincia}`
    }

    return "Dirección disponible próximamente"
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna 1: Descuentos */}
          <Card className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-default">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Descuentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Acumula puntos con cada compra y desbloquea rangos con mejores descuentos:
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-default">
                  <span className="text-2xl">🥉</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Bronce</p>
                      <Badge variant="secondary">
                        5% OFF
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">250 - 499 puntos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-default">
                  <span className="text-2xl">🥈</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Plata</p>
                      <Badge variant="secondary">
                        10% OFF
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">500 - 999 puntos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-default">
                  <span className="text-2xl">🥇</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Oro</p>
                      <Badge variant="secondary">
                        15% OFF
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">1,000+ puntos</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Al momento de la compra podrás escoger si usar tus puntos acumulados y la cantidad a utilizar.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Columna 2: Compra de Entradas */}
          <Card className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-default">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Compra de Entradas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                  <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Límite de compra</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Máximo <span className="font-bold">4 entradas</span> por cliente por evento.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Registro requerido</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Debes estar{" "}
                      <Link href="/login" className="font-semibold underline hover:text-primary transition-colors">
                        registrado
                      </Link>
                      {" "}e{" "}
                      <Link href="/login" className="font-semibold underline hover:text-primary transition-colors">
                        iniciar sesión
                      </Link>
                      {" "}para poder continuar con la compra.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                  <QrCode className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Códigos QR</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tus entradas se generan automáticamente tras el pago. Podrás descargarlos desde tu perfil.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Los precios incluyen la comisión por servicio. Los descuentos se aplican únicamente al valor de la entrada.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Columna 3: Acerca del Evento */}
          <Card className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-default">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Acerca del Evento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Recinto</p>
                    <p className="font-semibold text-base">{getVenueName()}</p>
                    <p className="text-sm text-muted-foreground mt-1">{getVenueAddress()}</p>
                  </div>
                </div>

                <div className="border-t pt-3 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Fecha</p>
                    <p className="font-semibold text-base">
                      {getFormattedDate()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Horario</p>
                    <p className="text-sm">
                      <span className="font-semibold">Inicio:</span> {getStartTime()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Duración:</span> {getEventDuration()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="bg-muted/50 p-3 rounded-lg border">
                    <div className="flex items-start gap-2">
                      <QrCode className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Ingreso al Evento</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deberá presentar el <span className="font-semibold">código QR de su entrada</span>.
                          Puede descargarlo desde la página de "Mis Tickets" en su perfil.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

