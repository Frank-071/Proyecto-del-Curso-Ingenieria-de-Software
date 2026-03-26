import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ReactNode } from "react"

interface AdminConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  confirmButtonClass?: string
  titleClass?: string
}

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  confirmButtonClass = "bg-destructive text-white hover:bg-destructive/80",
  titleClass = ""
}: AdminConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={titleClass}>
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button 
            className={confirmButtonClass}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}