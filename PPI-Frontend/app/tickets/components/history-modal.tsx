'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { History } from 'lucide-react'
import type { TransferHistoryItem } from '@/lib/api/services/transferencias'

interface HistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  historial: TransferHistoryItem[]
  loading: boolean
}

export function HistoryModal({ open, onOpenChange, historial, loading }: HistoryModalProps) {
  const formatTransferDate = (value: string) => {
    const hasTimezone = /[zZ]|[\+\-]\d{2}:?\d{2}$/.test(value)
    const isoValue = hasTimezone ? value : `${value}Z`
    const date = new Date(isoValue)
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Transferencias
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tienes transferencias registradas</div>
          ) : (
            <div className="space-y-3">
              {historial.map((transferencia) => (
                <Card key={transferencia.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={transferencia.tipo === 'enviada' ? 'default' : 'secondary'}>
                          {transferencia.tipo === 'enviada' ? 'Enviada' : 'Recibida'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTransferDate(transferencia.fecha_transferencia)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{transferencia.evento?.nombre || 'Evento'}</p>
                        <p className="text-sm text-muted-foreground">{transferencia.descripcion}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
