"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface UsuariosStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuarioId: number | null
  nombre: string | null
  usuarios: any[]
  onConfirm: () => void
  isLoading?: boolean
}

export function UsuariosStatusDialog({
  open,
  onOpenChange,
  usuarioId,
  nombre,
  usuarios,
  onConfirm,
  isLoading = false
}: UsuariosStatusDialogProps) {
  const currentUsuario = usuarioId ? usuarios.find(u => u.id === usuarioId) : null
  const isActive = currentUsuario?.activo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            {isActive ? "¿Desactivar usuario?" : "¿Activar usuario?"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {isActive ? (
              <>
                ¿Estás seguro que deseas <span className="font-medium">desactivar</span> al usuario <span className="font-medium">{nombre}</span>? 
                Esta acción no eliminará al usuario, pero no podrá acceder al sistema.
              </>
            ) : (
              <>
                ¿Estás seguro que deseas <span className="font-medium">activar</span> al usuario <span className="font-medium">{nombre}</span>? 
                Esta acción permitirá que el usuario acceda nuevamente al sistema.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </Button>
          <Button 
            className="bg-destructive text-white hover:bg-destructive/80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
