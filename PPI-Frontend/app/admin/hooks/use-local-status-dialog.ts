import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { LocalDisplay } from '@/lib/types/entities/local'

interface DialogState {
  open: boolean
  localId: number | null
  nombre: string | null
}

interface UseLocalStatusDialogReturn {
  dialogState: DialogState
  isLoading: boolean
  handleAction: (action: string, local: { id: number; nombre: string; estado: string }) => void
  handleConfirmStatusChange: () => Promise<void>
  closeDialog: () => void
}

export function useLocalStatusDialog(
  locales: LocalDisplay[],
  toggleLocalStatus: (id: number, activar: boolean) => Promise<{ success: boolean; error: string | null }>
): UseLocalStatusDialogReturn {
  const router = useRouter()
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    localId: null,
    nombre: null
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = useCallback((action: string, local: { id: number; nombre: string; estado: string }) => {
    if (action === "editar") {
      router.push(`/admin/locales/crear?edit=${local.id}`)
    } else if (action === "visualizar") {
      router.push(`/admin/locales/crear?view=${local.id}`)
    } else if (action === "desactivar") {
      setDialogState({
        open: true,
        localId: local.id,
        nombre: local.nombre
      })
    }
  }, [router])

  const handleConfirmStatusChange = useCallback(async () => {
    if (dialogState.localId && !isLoading) {
      setIsLoading(true)
      try {
        const currentLocal = locales?.find(l => l.id === dialogState.localId)
        const isActive = currentLocal?.estado === "Activo"
        const activar = !isActive

        const result = await toggleLocalStatus(dialogState.localId, activar)
        if (result.success) {
          toast.success(`Local ${activar ? 'activado' : 'desactivado'}`, {
            description: `El local ${dialogState.nombre} ha sido ${activar ? 'activado' : 'desactivado'} correctamente`
          })
          setDialogState({ open: false, localId: null, nombre: null })
        } else {
          toast.error(`Error al ${activar ? 'activar' : 'desactivar'} local`, {
            description: result.error || 'No se pudo cambiar el estado del local'
          })
        }
      } finally {
        setIsLoading(false)
      }
    }
  }, [dialogState, locales, toggleLocalStatus, isLoading])

  const closeDialog = useCallback(() => {
    setDialogState({ open: false, localId: null, nombre: null })
  }, [])

  return {
    dialogState,
    isLoading,
    handleAction,
    handleConfirmStatusChange,
    closeDialog
  }
}

