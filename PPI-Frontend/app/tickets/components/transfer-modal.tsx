'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Mail, Ticket } from 'lucide-react'
import type { SelectedEntradaInfo } from '@/lib/types/tickets'
import { useTransferWorkflow } from '../hooks/use-transfer-workflow'

interface TransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEntradas: SelectedEntradaInfo[]
  onSuccess?: () => void
}

export function TransferModal({ open, onOpenChange, selectedEntradas, onSuccess }: TransferModalProps) {
  const {
    transferDni,
    confirmText,
    isValidatingDni,
    isDniValid,
    isTransferring,
    setTransferDni,
    setConfirmText,
    validateDni,
    confirmTransfer,
    reset,
    canSubmit,
  } = useTransferWorkflow({
    selectedEntradas,
    onSuccess: () => {
      onSuccess?.()
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) {
      return
    }
    const timeout = setTimeout(() => {
      if (transferDni.trim()) {
        validateDni(transferDni)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [transferDni, validateDni, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Transferir Entradas
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Entradas a transferir:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedEntradas.map((entrada) => (
                <div key={entrada.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-sm">{entrada.eventoNombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {entrada.zonaNombre} - Entrada #{entrada.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {selectedEntradas.length === 0 && (
                <div className="text-sm text-muted-foreground">No hay entradas seleccionadas</div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-dni">DNI del destinatario</Label>
            <Input
              id="transfer-dni"
              type="text"
              placeholder="12345678"
              value={transferDni}
              onChange={(event) => setTransferDni(event.target.value)}
              className={`placeholder:text-muted-foreground/50 ${
                transferDni.trim() && !isValidatingDni ? (isDniValid ? 'border-green-500' : 'border-red-500') : ''
              }`}
            />
            {transferDni.trim() && !isValidatingDni && (
              <p className={`text-xs ${isDniValid ? 'text-green-600' : 'text-red-600'}`}>
                {isDniValid ? '✓ DNI válido' : '✗ DNI no válido o usuario no encontrado'}
              </p>
            )}
            {isValidatingDni && <p className="text-xs text-muted-foreground">Validando DNI...</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-confirm">Para confirmar, escribe "TRANSFERIR"</Label>
            <Input
              id="transfer-confirm"
              placeholder="TRANSFERIR"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Importante:</p>
              <p>Una vez transferidas, las entradas no podrán ser recuperadas. El destinatario será el nuevo propietario.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancelar
          </Button>
          <Button onClick={confirmTransfer} disabled={!canSubmit} className="cursor-pointer">
            {isTransferring ? 'Transfiriendo...' : 'Confirmar Transferencia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
