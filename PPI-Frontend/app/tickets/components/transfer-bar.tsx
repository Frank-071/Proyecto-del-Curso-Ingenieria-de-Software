'use client'

import { Button } from '@/components/ui/button'
import { Ticket } from 'lucide-react'

interface TransferBarProps {
  count: number
  onTransfer: () => void
}

export function TransferBar({ count, onTransfer }: TransferBarProps) {
  if (count <= 0) {
    return null
  }

  return (
    <div className="bg-primary/10 border border-primary/20 text-foreground p-4 rounded-lg shadow-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 sm:items-center">
        <Ticket className="h-5 w-5 text-primary" />
        <span className="font-semibold">
          {count} entrada{count !== 1 ? 's' : ''} seleccionada{count !== 1 ? 's' : ''}
        </span>
      </div>
      <Button onClick={onTransfer} className="w-full font-semibold px-6 py-2 cursor-pointer sm:w-auto">
        Transferir entradas
      </Button>
    </div>
  )
}
