"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface EventosActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventoId: number | null
  nombre: string | null
  nuevoEstado: string
  onNuevoEstadoChange: (estado: string) => void
  motivoCancelacion: string
  onMotivoCancelacionChange: (motivo: string) => void
  onConfirm: () => void
  tieneEntradasVendidas: boolean | null
  isLoadingEntradas: boolean
  onCheckEntradas: (eventoId: number) => Promise<void>
}

export function EventosActionDialog({
  open,
  onOpenChange,
  eventoId,
  nombre,
  nuevoEstado,
  onNuevoEstadoChange,
  motivoCancelacion,
  onMotivoCancelacionChange,
  onConfirm,
  tieneEntradasVendidas,
  isLoadingEntradas,
  onCheckEntradas
}: EventosActionDialogProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)

  const motivoRequerido = nuevoEstado === "Cancelado"
  const motivoInvalido = motivoRequerido && motivoCancelacion.trim().length === 0

  useEffect(() => {
    if (open && eventoId && nuevoEstado === "Cancelado") {
      onCheckEntradas(eventoId)
    }
  }, [open, eventoId, nuevoEstado, onCheckEntradas])

  useEffect(() => {
    if (nuevoEstado !== "Cancelado") {
      setShowConfirmModal(false)
      setConfirmChecked(false)
    }
  }, [nuevoEstado])

  useEffect(() => {
    if (!open) {
      setShowConfirmModal(false)
      setConfirmChecked(false)
    }
  }, [open])

  const handleConfirmClick = async () => {
    if (motivoInvalido) {
      return
    }

    if (nuevoEstado === "Cancelado" && tieneEntradasVendidas && !showConfirmModal) {
      setShowConfirmModal(true)
      return
    }
    if (showConfirmModal && !confirmChecked) {
      return
    }
    
    setShowConfirmModal(false)
    setConfirmChecked(false)
    await onConfirm()
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
    setConfirmChecked(false)
  }

  const mostrarAdvertencia = nuevoEstado === "Cancelado" && tieneEntradasVendidas && !showConfirmModal
  const botonDeshabilitado = (showConfirmModal && !confirmChecked) || motivoInvalido

  return (
    <>
      <Dialog open={open && !showConfirmModal} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle>
              Cambiar estado del evento
            </DialogTitle>
            <DialogDescription className="pt-2">
              Selecciona el nuevo estado para el evento <span className="font-medium">{nombre}</span>:
              
              <div className="grid grid-cols-1 gap-2 pt-4">
                <Select
                  value={nuevoEstado}
                  onValueChange={onNuevoEstadoChange}
                >
                  <SelectTrigger style={{ cursor: 'pointer' }}>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="Publicado" 
                      className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                    >
                      Publicado
                    </SelectItem>
                    <SelectItem 
                      value="Proximamente" 
                      className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                    >
                      Próximamente
                    </SelectItem>
                    <SelectItem 
                      value="Borrador" 
                      className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                    >
                      Borrador
                    </SelectItem>
                    <SelectItem 
                      value="Finalizado" 
                      className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                    >
                      Finalizado
                    </SelectItem>
                    <SelectItem 
                      value="Cancelado" 
                      className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                    >
                      Cancelado
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {isLoadingEntradas && nuevoEstado === "Cancelado" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verificando entradas vendidas...</span>
                  </div>
                )}

                {mostrarAdvertencia && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Este evento tiene entradas vendidas</p>
                        <p className="mt-1">Se requerirá una confirmación adicional para proceder con la cancelación.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {nuevoEstado === "Cancelado" && (
                  <div className="mt-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="motivo-cancelacion">
                      Motivo de cancelación
                    </label>
                    <Textarea
                      id="motivo-cancelacion"
                      value={motivoCancelacion}
                      onChange={(event) => onMotivoCancelacionChange(event.target.value)}
                      placeholder="Describe brevemente el motivo de la cancelación"
                      className="mt-2 resize-none"
                      rows={4}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Este texto se mostrará en la ventana de reembolso para los clientes.
                    </p>
                  </div>
                )}

                <div className="mt-2 text-sm text-muted-foreground">
                  {nuevoEstado === "Publicado" && "El evento será visible para todos los usuarios y se podrán comprar tickets."}
                  {nuevoEstado === "Proximamente" && "El evento será visible pero no se permitirá la compra de tickets todavía."}
                  {nuevoEstado === "Borrador" && "El evento no será visible para los usuarios y no se podrán comprar tickets."}
                  {nuevoEstado === "Finalizado" && "El evento se marcará como completado, mantendrá visibilidad pero no permitirá más compras."}
                  {nuevoEstado === "Cancelado" && !mostrarAdvertencia && "El evento será cancelado, ocultado del público y no se permitirán más ventas de tickets."}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              style={{ cursor: 'pointer' }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmClick}
              disabled={motivoInvalido}
              style={{ cursor: motivoInvalido ? 'not-allowed' : 'pointer' }}
              className={mostrarAdvertencia ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={handleCancelConfirm}>
        <DialogContent className="sm:max-w-md [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Confirmar cancelación
            </DialogTitle>
            <DialogDescription className="pt-2">
              <p className="mb-4 text-sm">
                Considerar las siguientes consecuencias:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm mb-4 text-muted-foreground">
                <li>Se enviará una notificación por correo electrónico a los compradores</li>
                <li>Se cambiará la información general del evento por información de reembolso</li>
                <li>Se habilitará el proceso de reembolso para los clientes</li>
              </ul>
              <div className="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-300 rounded-md">
                <Checkbox
                  id="confirm-cancel"
                  checked={confirmChecked}
                  onCheckedChange={(checked) => setConfirmChecked(checked === true)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="confirm-cancel"
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  Confirmo que entiendo las consecuencias y deseo proceder con la cancelación
                </label>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={handleCancelConfirm}
              style={{ cursor: 'pointer' }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmClick}
              disabled={botonDeshabilitado}
              className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ cursor: botonDeshabilitado ? 'not-allowed' : 'pointer' }}
            >
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}