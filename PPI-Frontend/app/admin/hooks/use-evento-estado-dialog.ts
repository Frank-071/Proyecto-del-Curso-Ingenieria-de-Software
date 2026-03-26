import { useState, useCallback, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { eventosService } from '@/lib/api/services/eventos'
import type { Evento, DialogState, MotivoCancelacion } from '@/lib/types/evento'

interface UseEventoEstadoDialogReturn {
  dialogEstado: DialogState
  nuevoEstado: string
  setNuevoEstado: (estado: string) => void
  motivoCancelacion: MotivoCancelacion
  setMotivoCancelacion: (motivo: MotivoCancelacion) => void
  tieneEntradasVendidas: boolean | null
  isLoadingEntradas: boolean
  handleAction: (action: string, evento: Evento) => void
  handleCloseDialog: () => void
  handleConfirmDialog: () => Promise<void>
  checkEntradasVendidas: (eventoId: number) => Promise<void>
}

export function useEventoEstadoDialog(
  eventos: Evento[],
  setEventos: Dispatch<SetStateAction<Evento[]>>
): UseEventoEstadoDialogReturn {
  const router = useRouter()
  const { toast } = useToast()
  
  const [dialogEstado, setDialogEstado] = useState<DialogState>({ 
    open: false, 
    eventoId: null,
    nombre: null,
    accion: null
  })
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [motivoCancelacion, setMotivoCancelacionState] = useState("")
  const [tieneEntradasVendidas, setTieneEntradasVendidas] = useState<boolean | null>(null)
  const [isLoadingEntradas, setIsLoadingEntradas] = useState(false)

  const handleMotivoChange = useCallback((motivo: string) => {
    setMotivoCancelacionState(motivo.slice(0, 2000))
  }, [])

  const handleAction = useCallback((action: string, evento: Evento) => {
    if (action === "editar") {
      router.push(`/admin/eventos/crear?edit=${evento.id}`)
    } else if (action === "visualizar") {
      router.push(`/admin/eventos/crear?view=${evento.id}`)
    } else if (action === "cambiar-estado") {
      setNuevoEstado(evento.estado)
      handleMotivoChange(evento.motivo_cancelacion ?? "")
      setDialogEstado({ 
        open: true, 
        eventoId: evento.id,
        nombre: evento.nombre,
        accion: "cambiar-estado"
      })
    }
  }, [router, handleMotivoChange])

  const checkEntradasVendidas = useCallback(async (eventoId: number) => {
    setIsLoadingEntradas(true)
    try {
      const result = await eventosService.hasEntradasVendidas(eventoId)
      if (result.success && result.data) {
        setTieneEntradasVendidas(result.data.tiene_entradas || false)
      } else {
        setTieneEntradasVendidas(false)
      }
    } catch {
      setTieneEntradasVendidas(false)
    } finally {
      setIsLoadingEntradas(false)
    }
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogEstado({ open: false, eventoId: null, nombre: null, accion: null })
    setNuevoEstado("")
    setMotivoCancelacionState("")
    setTieneEntradasVendidas(null)
  }, [])

  const handleNuevoEstadoChange = useCallback((estado: string) => {
    setNuevoEstado(estado)
    if (estado !== "Cancelado") {
      setMotivoCancelacionState("")
    }
  }, [])

  const handleConfirmDialog = useCallback(async () => {
    if (!dialogEstado.eventoId || !dialogEstado.nombre) return

    const eventoOriginal = eventos.find(e => e.id === dialogEstado.eventoId)
    if (!eventoOriginal) return

    const motivoNormalizado = nuevoEstado === "Cancelado" ? motivoCancelacion.trim() : null

    try {
      setEventos((prevEventos: Evento[]) => {
        const eventoIndex = prevEventos.findIndex(e => e.id === dialogEstado.eventoId)
        if (eventoIndex === -1) return prevEventos
        const eventosActualizados = [...prevEventos]
        eventosActualizados[eventoIndex] = {
          ...eventosActualizados[eventoIndex],
          estado: nuevoEstado,
          motivo_cancelacion: nuevoEstado === "Cancelado" ? motivoNormalizado : null
        }
        return eventosActualizados
      })

      handleCloseDialog()

      toast({
        title: "Estado actualizado",
        description: `El evento "${dialogEstado.nombre}" ahora está ${nuevoEstado.toLowerCase()}`,
      })

      const resultado = await eventosService.actualizarEstado(dialogEstado.eventoId, nuevoEstado, motivoNormalizado)
      
      if (!resultado.success) {
        setEventos((prevEventos: Evento[]) => {
          const eventoIndex = prevEventos.findIndex(e => e.id === dialogEstado.eventoId)
          if (eventoIndex === -1) return prevEventos
          const eventosRevertidos = [...prevEventos]
          eventosRevertidos[eventoIndex] = {
            ...eventosRevertidos[eventoIndex],
            estado: eventoOriginal.estado,
            motivo_cancelacion: eventoOriginal.motivo_cancelacion ?? null
          }
          return eventosRevertidos
        })

        toast({
          title: "Error al actualizar estado",
          description: resultado.detail || "No se pudo actualizar el estado del evento",
          variant: "destructive",
        })
        return
      }

      if (resultado.data) {
        setEventos((prevEventos: Evento[]) => {
          const eventoIndex = prevEventos.findIndex(e => e.id === dialogEstado.eventoId)
          if (eventoIndex === -1) return prevEventos
          const eventosActualizados = [...prevEventos]
          eventosActualizados[eventoIndex] = {
            ...eventosActualizados[eventoIndex],
            estado: resultado.data.estado,
            motivo_cancelacion: resultado.data.motivo_cancelacion ?? null
          }
          return eventosActualizados
        })
      }
    } catch (error) {
      setEventos((prevEventos: Evento[]) => {
        const eventoIndex = prevEventos.findIndex(e => e.id === dialogEstado.eventoId)
        if (eventoIndex === -1) return prevEventos
        const eventosRevertidos = [...prevEventos]
        eventosRevertidos[eventoIndex] = {
          ...eventosRevertidos[eventoIndex],
          estado: eventoOriginal.estado,
          motivo_cancelacion: eventoOriginal.motivo_cancelacion ?? null
        }
        return eventosRevertidos
      })

      toast({
        title: "Error al actualizar estado",
        description: "No se pudo actualizar el estado del evento",
        variant: "destructive",
      })
    }
  }, [dialogEstado, eventos, handleCloseDialog, motivoCancelacion, nuevoEstado, setEventos, toast])

  return {
    dialogEstado,
    nuevoEstado,
    setNuevoEstado: handleNuevoEstadoChange,
    motivoCancelacion,
    setMotivoCancelacion: handleMotivoChange,
    tieneEntradasVendidas,
    isLoadingEntradas,
    handleAction,
    handleCloseDialog,
    handleConfirmDialog,
    checkEntradasVendidas
  }
}

