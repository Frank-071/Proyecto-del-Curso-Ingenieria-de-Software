import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoToLogin?: () => void
}

export function SuccessModal({ open, onOpenChange, onGoToLogin }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Cambio con éxito</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          Tu contraseña se ha actualizado correctamente.
        </p>
        <DialogFooter>
          <Button
            onClick={onGoToLogin ? onGoToLogin : () => window.open("/login", "_blank")}
            className="cursor-pointer"
          >
            Ir al login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
