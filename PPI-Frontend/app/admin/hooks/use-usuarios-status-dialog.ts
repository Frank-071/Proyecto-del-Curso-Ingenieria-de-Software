import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { UsuarioDisplay } from '@/lib/types/entities/usuario'

interface DialogState {
    open: boolean
    usuarioId: number | null
    nombres: string | null
    apellidos: string | null
}

interface UseUsuariosStatusDialogReturn {
    dialogState: DialogState
    handleAction: (action: string, usuario: UsuarioDisplay) => void
    handleConfirmStatusChange: () => Promise<void>
    closeDialog: () => void
    isLoading: boolean
}
export function useUsuariosStatusDialog(
    usuarios: UsuarioDisplay[],
    toggleUsuarioStatus: (id: number, activar: boolean) => Promise<{ success: boolean; error: string | null }>
): UseUsuariosStatusDialogReturn {
    const router = useRouter()
    const [dialogState, setDialogState] = useState<DialogState>({
        open: false,
        usuarioId: null,
        nombres: null,
        apellidos: null
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleAction = useCallback((action: string, usuario: UsuarioDisplay) => {
        if (action === "editar") {
            router.push(`/admin/usuarios/crear?edit=${usuario.id}`)
        } else if (action === "visualizar") {
            router.push(`/admin/usuarios/crear?view=${usuario.id}`)
        } else if (action === "desactivar") {
            setDialogState({
                open: true,
                usuarioId: usuario.id,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos
            })
        }
    }, [router])

    const handleConfirmStatusChange = useCallback(async () => {
        if (dialogState.usuarioId && !isLoading) {
            setIsLoading(true)
            const currentUsuario = usuarios?.find(u => u.id === dialogState.usuarioId)
            const isActive = currentUsuario?.activo
            const activar = !isActive

            const result = await toggleUsuarioStatus(dialogState.usuarioId, activar)
            if (result.success) {
                toast.success(`Usuario ${activar ? 'activado' : 'desactivado'}`, {
                    description: `El usuario ${dialogState.nombres} ha sido ${activar ? 'activado' : 'desactivado'} correctamente`
                })
                setDialogState({ open: false, usuarioId: null, nombres: null, apellidos: null })
            } else {
                toast.error(`Error al ${activar ? 'activar' : 'desactivar'} usuario`, {
                    description: result.error || 'No se pudo cambiar el estado del usuario'
                })
            }
            setIsLoading(false)
        }
    }, [dialogState, usuarios, toggleUsuarioStatus, isLoading])

    const closeDialog = useCallback(() => {
        if (!isLoading) {
            setDialogState({ open: false, usuarioId: null, nombres: null, apellidos: null })
        }
    }, [isLoading])

    return {
        dialogState,
        handleAction,
        handleConfirmStatusChange,
        closeDialog,
        isLoading
    }
}
