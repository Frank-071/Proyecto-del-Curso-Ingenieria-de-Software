'use client'

import { useCallback, useMemo, useState } from 'react'
import { clientesService } from '@/lib/api/services/clientes'
import { transferenciasService } from '@/lib/api/services/transferencias'
import type { SelectedEntradaInfo } from '@/lib/types/tickets'
import { toast } from 'sonner'

interface UseTransferWorkflowParams {
  selectedEntradas: SelectedEntradaInfo[]
  onSuccess?: () => void
}

interface UseTransferWorkflowResult {
  transferDni: string
  confirmText: string
  isValidatingDni: boolean
  isDniValid: boolean
  isTransferring: boolean
  setTransferDni: (value: string) => void
  setConfirmText: (value: string) => void
  validateDni: (dni: string) => Promise<void>
  confirmTransfer: () => Promise<void>
  reset: () => void
  canSubmit: boolean
}

export const useTransferWorkflow = ({ selectedEntradas, onSuccess }: UseTransferWorkflowParams): UseTransferWorkflowResult => {
  const [transferDni, setTransferDni] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isValidatingDni, setIsValidatingDni] = useState(false)
  const [isDniValid, setIsDniValid] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  const entradaIds = useMemo(() => selectedEntradas.map((entrada) => entrada.id), [selectedEntradas])

  const reset = useCallback(() => {
    setTransferDni('')
    setConfirmText('')
    setIsValidatingDni(false)
    setIsDniValid(false)
    setIsTransferring(false)
  }, [])

  const validateDni = useCallback(async (dni: string) => {
    const sanitized = dni.trim()
    if (!sanitized) {
      setIsDniValid(false)
      return
    }
    setIsValidatingDni(true)
    try {
      const result = await clientesService.buscarPorDni(sanitized)
      setIsDniValid(!!result?.cliente_id)
    } catch (error) {
      setIsDniValid(false)
    } finally {
      setIsValidatingDni(false)
    }
  }, [])

  const confirmTransfer = useCallback(async () => {
    if (entradaIds.length === 0) {
      toast.error('Sin entradas seleccionadas')
      return
    }
    if (confirmText !== 'TRANSFERIR') {
      toast.error('Debes escribir TRANSFERIR para confirmar')
      return
    }
    if (!transferDni.trim() || !isDniValid) {
      toast.error('DNI inválido', { description: 'Debes ingresar un DNI válido' })
      return
    }
    setIsTransferring(true)
    try {
      await transferenciasService.confirmar({
        destinatario_dni: transferDni.trim(),
        entrada_ids: entradaIds,
      })
      toast.success('Transferencia exitosa')
      reset()
      onSuccess?.()
    } catch (error) {
      toast.error('Error en la transferencia', { description: error instanceof Error ? error.message : undefined })
    } finally {
      setIsTransferring(false)
    }
  }, [entradaIds, confirmText, transferDni, isDniValid, onSuccess, reset])

  return {
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
    canSubmit: entradaIds.length > 0 && confirmText === 'TRANSFERIR' && isDniValid && !isValidatingDni && !isTransferring,
  }
}
