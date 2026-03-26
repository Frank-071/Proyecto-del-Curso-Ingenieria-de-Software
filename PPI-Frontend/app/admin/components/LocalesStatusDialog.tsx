"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface LocalesStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  localId: number | null
  nombre: string | null
  locales: any[]
  onConfirm: () => void
  isLoading?: boolean
}

export function LocalesStatusDialog({
  open,
  onOpenChange,
  localId,
  nombre,
  locales,
  onConfirm,
  isLoading = false
}: LocalesStatusDialogProps) {
  const currentLocal = localId ? locales.find(l => l.id === localId) : null
  const isActive = currentLocal?.estado === "Activo"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            {isActive ? "¿Desactivar local?" : "¿Activar local?"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {isActive ? (
              <>
                ¿Estás seguro que deseas <span className="font-medium">desactivar</span> el local <span className="font-medium">{nombre}</span>? 
                Esta acción no eliminará el local, pero no estará disponible para nuevos eventos.
              </>
            ) : (
              <>
                ¿Estás seguro que deseas <span className="font-medium">activar</span> el local <span className="font-medium">{nombre}</span>? 
                Esta acción hará que el local esté disponible para nuevos eventos.
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
            className="bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200" 
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