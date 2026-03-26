'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Ticket } from 'lucide-react'
import { useUserStore } from '@/lib/stores/user-store'
import { useIsAuthenticated, useUserInfo, useAuthStore } from '@/lib/stores/auth-store'
import { useEntradasCliente } from '@/lib/hooks/eventos'
import { toast } from 'sonner'
import { PageSpinner } from '@/components/ui/page-spinner'
import { TicketList } from './components/ticket-list'
import { TransferBar } from './components/transfer-bar'
import { TransferModal } from './components/transfer-modal'
import { HistoryModal } from './components/history-modal'
import { useTicketMetadata } from './hooks/use-ticket-metadata'
import { useTicketSelection } from './hooks/use-ticket-selection'
import { useTransferHistory } from './hooks/use-transfer-history'

export function TicketsPageWrapper() {
  const router = useRouter()
  const { user } = useUserStore()
  const isAuthenticated = useIsAuthenticated()
  const userInfo = useUserInfo()
  const initialized = useAuthStore(state => state.initialized)
  const initializeAuth = useAuthStore(state => state.initializeAuth)
  const { entradas, loading, listarPorCliente } = useEntradasCliente()
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [downloadingQrId, setDownloadingQrId] = useState<number | null>(null)

  const { zoneMap, eventMap, grouped } = useTicketMetadata(entradas)
  const {
    selectedMap,
    selectedCount,
    toggleEntrada,
    setEntradasSelection,
    clearSelection,
    selectedEntradas,
  } = useTicketSelection({ entradas, zoneMap, eventMap })
  const { historial, loading: loadingHistorial, fetchHistorial } = useTransferHistory()

  const isLoading = loading

  const getClienteId = useCallback((): number | null => {
    const rawId = userInfo?.sub ?? user?.id
    if (rawId === undefined || rawId === null) {
      return null
    }
    const parsed = typeof rawId === 'number' ? rawId : Number(rawId)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [userInfo?.sub, user?.id])

  // Inicializar autenticación al montar el componente
  useEffect(() => {
    if (!initialized) {
      initializeAuth()
    }
  }, [initialized, initializeAuth])

  // Redirigir solo si la autenticación está inicializada y el usuario no está autenticado
  useEffect(() => {
    if (initialized && !isAuthenticated && !loading) {
      router.push('/')
    }
  }, [initialized, isAuthenticated, loading, router])

  useEffect(() => {
    const clienteId = getClienteId()
    if (isAuthenticated && clienteId) {
      listarPorCliente(clienteId)
    }
  }, [getClienteId, isAuthenticated, listarPorCliente])

  const handleOpenHistory = useCallback(async () => {
    const clienteId = getClienteId()
    if (!clienteId) {
      toast.error('No se pudo obtener el cliente para cargar historial')
      return
    }
    setShowHistoryModal(true)
    await fetchHistorial(clienteId)
  }, [fetchHistorial, getClienteId])

  const handleRefreshEntradas = useCallback(async () => {
    const clienteId = getClienteId()
    if (clienteId) {
      await listarPorCliente(clienteId)
      clearSelection()
    }
  }, [clearSelection, getClienteId, listarPorCliente])

  const handleDownloadQr = useCallback(
    async (entradaId: number) => {
      // Evitar múltiples clicks
      if (downloadingQrId !== null) {
        return
      }

      setDownloadingQrId(entradaId)

      try {
        const { entradassService } = await import('@/lib/api/services/eventos/entradas')
        const result = await entradassService.getQrPdfUrl(entradaId)

        if (!result.success || !result.data) {
          toast.info('PDF no disponible', {
            description: `Vuelva a intentar en unos segundos`,
          })
          return
        }

        const responseData = result.data
        const pdfUrl = responseData.data?.pdf_url || responseData.pdf_url

        if (!pdfUrl) {
          toast.info('PDF no disponible', {
            description: `Vuelva a intentar en unos segundos`,
          })
          return
        }

        // El backend ya verifica que el PDF existe, así que podemos abrir directamente
        window.open(pdfUrl, '_blank')
      } catch (error: any) {
        toast.info('PDF no disponible', {
          description: `Vuelva a intentar en unos segundos`,
        })
      } finally {
        setDownloadingQrId(null)
      }
    },
    [downloadingQrId],
  )

  // ========= NUEVO: lógica de eventos valorables =========
  const canRateEvent = useCallback(
    (eventId: number): boolean => {
      const eventInfo = eventMap[eventId]
      if (!eventInfo || !eventInfo.endDate) return false

      const endTs = new Date(eventInfo.endDate).getTime()
      if (Number.isNaN(endTs)) return false

      const oneHourAfterEnd = endTs + 60 * 60 * 1000
      const now = Date.now()

      return now >= oneHourAfterEnd
    },
    [eventMap],
  )

  const hasRateableEvents = useMemo(
    () => Object.values(grouped).some(eventGroup => canRateEvent(eventGroup.eventId)),
    [grouped, canRateEvent],
  )
  // =======================================================

  const content = useMemo(() => {
    if (!entradas.length) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No tienes tickets vigentes</h3>
            <p className="text-muted-foreground mb-4">Cuando compres entradas, aparecerán aquí</p>
            <Button asChild className="cursor-pointer">
              <Link href="/">Explorar eventos</Link>
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {selectedCount > 0 && (
          <TransferBar count={selectedCount} onTransfer={() => setShowTransferModal(true)} />
        )}
        <TicketList
          grouped={grouped}
          eventMap={eventMap}
          selectedMap={selectedMap}
          onEntradaToggle={(id, checked) => toggleEntrada(id, checked)}
          onBulkSelection={setEntradasSelection}
          onDownloadQr={handleDownloadQr}
          downloadingQrId={downloadingQrId}
          // NUEVO: se expone al listado para mostrar la encuesta al lado del evento
          canRateEvent={canRateEvent}
        />
      </div>
    )
  }, [
    entradas.length,
    eventMap,
    grouped,
    handleDownloadQr,
    isLoading,
    selectedCount,
    selectedMap,
    setEntradasSelection,
    toggleEntrada,
    downloadingQrId,
    canRateEvent,
  ])

  // Mostrar loader mientras se inicializa la autenticación o está cargando
  if (!initialized || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <PageSpinner message="Cargando tus tickets..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Tickets</h1>
            <p className="text-muted-foreground">
              Gestiona tus entradas vigentes y transfiere tickets
            </p>

            {hasRateableEvents && (
              <p className="mt-1 text-sm text-muted-foreground">
                La encuesta de satisfacción (1 a 5 estrellas) se habilita automáticamente 1 hora
                después de que el evento haya finalizado. Podrás completarla desde esta sección,
                al lado de cada evento.
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleOpenHistory}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ClipboardList className="h-4 w-4" />
            Ver historial
          </Button>
        </div>
        {content}
      </div>

      <TransferModal
        open={showTransferModal}
        onOpenChange={open => {
          setShowTransferModal(open)
          if (!open) {
            clearSelection()
          }
        }}
        selectedEntradas={selectedEntradas}
        onSuccess={handleRefreshEntradas}
      />

      <HistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        historial={historial}
        loading={loadingHistorial}
      />
    </div>
  )
}

