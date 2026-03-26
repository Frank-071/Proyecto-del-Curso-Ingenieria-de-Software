'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Ticket, ChevronDown, ChevronRight, Eye, Send, Loader2 } from 'lucide-react'
import type { TicketEventMap, TicketGroupedMap, TicketEventInfo } from '@/lib/types/tickets'
import { toast } from 'sonner'

interface TicketListProps {
  grouped: TicketGroupedMap
  eventMap: TicketEventMap
  selectedMap: Record<number, boolean>
  onEntradaToggle: (entradaId: number, checked: boolean) => void
  onBulkSelection: (entradaIds: number[], checked: boolean) => void
  onDownloadQr: (entradaId: number) => void
  downloadingQrId: number | null
  canRateEvent: (eventId: number) => boolean
}

// Determinar si el evento está vigente o concluido según la fecha de fin
function getEventComputedStatus(event: TicketEventInfo) {
  if (!event.endDate) {
    return 'vigente' as const
  }

  const endTs = new Date(event.endDate).getTime()
  if (Number.isNaN(endTs)) {
    return 'vigente' as const
  }

  const now = Date.now()
  return now >= endTs ? 'concluido' as const : 'vigente' as const
}

const formatCurrency = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
  }
  if (typeof value === 'string') {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) {
      return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(numeric)
    }
  }
  return null
}

const formatDateTime = (value: string | null | undefined): string | null => {
  if (!value) {
    return null
  }

  // Si el string no tiene indicador de zona horaria (Z, +, -), asumimos que es UTC
  let dateString = value.trim()
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.match(/-\d{2}:\d{2}$/)) {
    dateString = dateString + 'Z'
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  // Formatear usando la zona horaria local del navegador
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function TicketList({
  grouped,
  eventMap,
  selectedMap,
  onEntradaToggle,
  onBulkSelection,
  onDownloadQr,
  downloadingQrId,
  canRateEvent,
}: TicketListProps) {
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({})

  const handleZoneToggle = (key: string) => {
    setExpandedZones(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Ordenar grupos por la fecha de creación más reciente de sus entradas
  const groups = Object.values(grouped).sort((a, b) => {
    const getLatestDate = (group: typeof a) => {
      const allDates = Object.values(group.zones)
        .flatMap(zone => zone.entries)
        .map(entrada => entrada.fecha_creacion || entrada.fecha_transaccion || '')
        .filter(Boolean)
        .map(date => new Date(date).getTime())

      return allDates.length > 0 ? Math.max(...allDates) : 0
    }

    const dateA = getLatestDate(a)
    const dateB = getLatestDate(b)

    // Ordenar descendente (más recientes primero)
    return dateB - dateA
  })

  if (groups.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {groups.map(group => {
        const eventInfo = eventMap[group.eventId]
        if (!eventInfo) return null

        const eventStatus = eventInfo.status ?? null
        const isCancelled = eventStatus?.toLowerCase() === 'cancelado'

        // Estado calculado por fecha de fin (solo si no está cancelado)
        const computedStatus = getEventComputedStatus(eventInfo)
        const isFinished = !isCancelled && computedStatus === 'concluido'

        const badgeLabel = isCancelled
          ? 'Evento cancelado'
          : isFinished
            ? 'Concluido'
            : 'Vigente'

        const badgeColorClasses = isCancelled
          ? 'border border-rose-200 bg-rose-50 text-rose-700'
          : isFinished
            ? 'border border-zinc-200 bg-zinc-50 text-zinc-700'
            : 'border border-emerald-200 bg-emerald-50 text-emerald-700'

        const totalTickets = Object.values(group.zones).reduce((sum, zone) => sum + zone.count, 0)
        const eventStart = eventInfo.startDate ? new Date(eventInfo.startDate) : null

        // Un evento es valorable si no está cancelado y ya pasó 1 hora de su fin
        const isRateable = !isCancelled && canRateEvent(group.eventId)

        return (
          <Card key={group.eventId} className="overflow-hidden border border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="relative mx-auto h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-border/30 shadow-sm sm:mx-0 sm:h-28 sm:w-28">
                  <Image
                    src={eventInfo.icon || '/placeholder.svg'}
                    alt={eventInfo.name || 'Evento'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
                  <CardTitle className="text-xl font-semibold text-balance text-foreground">
                    <Link
                      href={`/evento/${group.eventId}`}
                      className="transition-colors hover:text-primary"
                    >
                      {eventInfo.name || 'Evento'}
                    </Link>
                  </CardTitle>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {eventStart
                        ? new Intl.DateTimeFormat('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(eventStart)
                        : 'Fecha por confirmar'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span>
                        {totalTickets} entrada{totalTickets !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:w-auto sm:items-end sm:gap-3">
                  <Badge
                    variant={isCancelled ? 'destructive' : 'default'}
                    className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full text-center w-full sm:w-48 ${badgeColorClasses}`}
                  >
                    {badgeLabel}
                  </Badge>

                  {isCancelled && (
                    <Button
                      asChild
                      variant="destructive"
                      size="sm"
                      className="font-semibold shadow-sm hover:bg-rose-700 w-full sm:w-48 rounded-full"
                    >
                      <Link href={`/evento/${group.eventId}`}>Mayor información</Link>
                    </Button>
                  )}

                  {/* Encuesta: solo eventos no cancelados y ya concluidos (+1h) */}
                  {isRateable && (
                    <div className="flex flex-col items-end gap-1 w-full sm:w-48">
                      <p className="text-xs text-muted-foreground text-right">
                        Encuesta de satisfacción
                      </p>
                      <EventRating eventId={group.eventId} />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {Object.entries(group.zones).map(([zoneId, zone]) => {
                  const zoneKey = `${group.eventId}-${zoneId}`
                  const isExpanded = expandedZones[zoneKey] || false
                  const zoneEntries = zone.entries || []
                  const transferibleEntries = zoneEntries.filter(entrada => !entrada.fue_transferida)
                  const transferibleIds = transferibleEntries.map(entrada => entrada.id)
                  const selectedInZone = transferibleIds.filter(entradaId => selectedMap[entradaId]).length
                  const hasSelection = selectedInZone > 0

                  return (
                    <div key={zoneId} className="space-y-2">
                      <div
                        className={`flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300 cursor-pointer ${
                          isExpanded
                            ? 'bg-primary/10 border-primary shadow-lg shadow-primary/25'
                            : 'bg-muted/50 border-transparent hover:bg-muted/70'
                        }`}
                        onClick={() => handleZoneToggle(zoneKey)}
                      >
                        <div className="flex items-start gap-3 sm:items-center">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold leading-tight">{zone.name}</div>
                            <p className="text-sm text-muted-foreground">
                              {zone.count} entrada{zone.count !== 1 ? 's' : ''} ·{' '}
                              {transferibleEntries.length} transferible
                              {transferibleEntries.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              transferibleEntries.length
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {transferibleEntries.length > 0
                              ? `${transferibleEntries.length} ${
                                  transferibleEntries.length === 1 ? 'lista' : 'listas'
                                } para transferir`
                              : 'Todas transferidas'}
                          </Badge>
                          {hasSelection && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedInZone} seleccionada{selectedInZone !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant={hasSelection ? 'outline' : 'secondary'}
                            disabled={!transferibleEntries.length}
                            onClick={event => {
                              event.stopPropagation()
                              onBulkSelection(transferibleIds, !hasSelection)
                            }}
                            className="ml-auto flex w-full cursor-pointer items-center justify-center gap-2 sm:w-auto"
                          >
                            <Send className="h-4 w-4" />
                            {hasSelection ? 'Limpiar selección' : 'Seleccionar todas'}
                          </Button>
                        </div>
                      </div>
                      {zoneEntries.length > 0 && (
                        <div
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="ml-9 space-y-2 pt-2">
                            {zoneEntries.map((entrada, index) => {
                              const isTransferible = !entrada.fue_transferida
                              const isSelected = !!selectedMap[entrada.id]
                              const priceLabel = formatCurrency(entrada.total_zona)
                              const dateLabel = formatDateTime(entrada.fecha_transaccion)

                              const secondaryInfoParts: string[] = []
                              if (dateLabel) {
                                secondaryInfoParts.push(`Comprado el ${dateLabel}`)
                              }
                              if (priceLabel) {
                                secondaryInfoParts.push(priceLabel)
                              }

                              return (
                                <div
                                  key={entrada.id}
                                  className={`group flex flex-col gap-4 rounded-xl border bg-background/80 p-4 shadow-sm transition-all duration-300 ease-out sm:flex-row sm:items-center sm:justify-between ${
                                    isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                                  } ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 group-hover:bg-primary/10 group-hover:shadow-md'
                                      : 'border-muted group-hover:bg-muted/50 group-hover:shadow-md group-hover:border-muted-foreground/30'
                                  }`}
                                  style={{
                                    transitionDelay: isExpanded
                                      ? `${index * 100}ms`
                                      : `${(zone.entries.length - index - 1) * 100}ms`,
                                  }}
                                >
                                  <div
                                    className={`flex items-start gap-3 ${
                                      isTransferible ? '' : 'opacity-60'
                                    } sm:items-center`}
                                  >
                                    <Ticket
                                      className={`h-4 w-4 ${
                                        isTransferible ? 'text-primary' : 'text-muted-foreground'
                                      }`}
                                    />
                                    <div className="space-y-0.5">
                                      <p className="text-sm font-semibold">Entrada #{entrada.id}</p>
                                      {secondaryInfoParts.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                          {secondaryInfoParts.join(' · ')}
                                        </p>
                                      )}
                                      <p
                                        className={`text-xs font-semibold ${
                                          isTransferible ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                      >
                                        {isTransferible
                                          ? 'Disponible para transferir'
                                          : 'Ya transferida'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                                    {isTransferible && (
                                      <Button
                                        size="sm"
                                        variant={isSelected ? 'default' : 'secondary'}
                                        onClick={() => onEntradaToggle(entrada.id, !isSelected)}
                                        className="flex w-full items-center justify-center gap-2 cursor-pointer sm:w-40"
                                      >
                                        <Send className="h-4 w-4" />
                                        {isSelected ? 'Quitar selección' : 'Seleccionar'}
                                      </Button>
                                    )}
                                    {isTransferible && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onDownloadQr(entrada.id)}
                                        disabled={downloadingQrId !== null}
                                        className="flex w-full items-center justify-center gap-2 cursor-pointer sm:w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {downloadingQrId === entrada.id ? (
                                          <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generando PDF...
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="h-4 w-4" />
                                            Ver ticket
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function EventRating({ eventId }: { eventId: number }) {
  const [value, setValue] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleRate = async (score: number) => {
    if (saving) return
    setSaving(true)
    try {
      // TODO: aquí llamas a tu backend
      // await encuestasService.rateEvent(eventId, score)

      setValue(score)
      toast.success('¡Gracias por tu valoración!')
    } catch (error) {
      toast.error('No se pudo registrar tu valoración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={saving}
          onClick={() => handleRate(star)}
          className="cursor-pointer"
        >
          <span
            className={
              star <= (value ?? 0)
                ? 'text-yellow-400 text-xl'
                : 'text-muted-foreground text-xl'
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  )
}
