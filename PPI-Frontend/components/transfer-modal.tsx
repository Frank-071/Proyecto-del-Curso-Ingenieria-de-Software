"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PurchasedTicket } from "@/lib/types/auth"
import { toast } from "sonner"
import {
  Mail,
  MessageSquare,
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  Plus,
  Minus,
} from "lucide-react"

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTickets: PurchasedTicket[]
  onTransfer: (recipientDni: string, message: string) => void
}

type TransferStep = "recipient" | "success"

interface TransferQuantity {
  ticketId: string
  quantity: number
  maxQuantity: number
}

export function TransferModal({ isOpen, onClose, selectedTickets, onTransfer }: TransferModalProps) {
  const [currentStep, setCurrentStep] = useState<TransferStep>("recipient")
  const [isTransferring, setIsTransferring] = useState(false)

  // Estados para validación de DNI y confirmación
  const [transferDNI, setTransferDNI] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [isDNIValid, setIsDNIValid] = useState(false)
  const [isValidatingDNI, setIsValidatingDNI] = useState(false)

  const [transferQuantities, setTransferQuantities] = useState<TransferQuantity[]>([])

  useEffect(() => {
    console.log("[v0] Selected tickets changed:", selectedTickets)
    const newQuantities = selectedTickets.map((ticket) => ({
      ticketId: ticket.id,
      quantity: 0, // Empezar con 0 para permitir selección opcional
      maxQuantity: ticket.quantity,
    }))
    console.log("[v0] New transfer quantities:", newQuantities)
    setTransferQuantities(newQuantities)
  }, [selectedTickets])

  const updateTransferQuantity = (ticketId: string, newQuantity: number) => {
    console.log("[v0] Updating quantity for ticket:", ticketId, "new quantity:", newQuantity)
    setTransferQuantities((prev) => {
      const updated = prev.map((item) =>
        item.ticketId === ticketId ? { ...item, quantity: Math.max(0, Math.min(newQuantity, item.maxQuantity)) } : item,
      )
      console.log("[v0] Updated transfer quantities:", updated)
      return updated
    })
  }

  // Función para validar DNI del destinatario
  const validateDNI = async (dni: string) => {
    if (!dni.trim()) {
      setIsDNIValid(false)
      return
    }

    setIsValidatingDNI(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${base}/clientes/buscar?dni=${encodeURIComponent(dni.trim())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      setIsDNIValid(response.ok && result.cliente_id)
    } catch (error) {
      setIsDNIValid(false)
    } finally {
      setIsValidatingDNI(false)
    }
  }

  // Función para manejar cambio en el campo DNI
  const handleDNIChange = (value: string) => {
    setTransferDNI(value)
    
    // Validar automáticamente cuando el DNI tenga 8 dígitos
    if (value.trim().length === 8 && /^\d+$/.test(value.trim())) {
      validateDNI(value.trim())
    } else {
      setIsDNIValid(false)
    }
  }

  const handleConfirmTransfer = async () => {
    // Validaciones antes de proceder
    if (totalTicketsToTransfer === 0) {
      toast.error('Selección requerida', {
        description: "Debes seleccionar por lo menos 1 entrada para transferir"
      })
      return
    }

    if (confirmText !== "TRANSFERIR") {
      toast.error('Confirmación requerida', {
        description: "Debes escribir exactamente 'TRANSFERIR' para confirmar"
      })
      return
    }

    if (!transferDNI.trim() || !isDNIValid) {
      toast.error('DNI inválido', {
        description: 'Debes ingresar un DNI válido'
      })
      return
    }

    setIsTransferring(true)
    
    try {
      // Aquí realizarías la transferencia real
      await onTransfer(transferDNI, "")
      
      setCurrentStep("success")
      
      // Limpiar el formulario
      setTransferDNI("")
      setConfirmText("")
      setIsDNIValid(false)
      
    } catch (error) {
      toast.error('Error en la transferencia', {
        description: 'No se pudo completar la transferencia. Inténtalo de nuevo.'
      })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleFinish = () => {
    setCurrentStep("recipient")
    setTransferDNI("")
    setConfirmText("")
    setIsDNIValid(false)
    onClose()
  }

  const totalTicketsToTransfer = transferQuantities.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {currentStep === "recipient" && "Transferir Entradas"}
            {currentStep === "success" && "¡Transferencia Exitosa!"}
          </DialogTitle>
        </DialogHeader>

        {currentStep === "recipient" && (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Seleccionar cantidades a transferir</h3>
              <div className="space-y-3">
                {selectedTickets.map((ticket) => {
                  const transferItem = transferQuantities.find((item) => item.ticketId === ticket.id)
                  console.log("[v0] Rendering ticket:", ticket.id, "transfer item:", transferItem)
                  return (
                    <div key={ticket.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{ticket.eventName}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.ticketType} - {ticket.zone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("[v0] Minus button clicked for ticket:", ticket.id)
                            updateTransferQuantity(ticket.id, (transferItem?.quantity || 0) - 1)
                          }}
                          disabled={transferItem?.quantity === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center text-sm font-medium">
                          {transferItem?.quantity || 0} / {ticket.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("[v0] Plus button clicked for ticket:", ticket.id)
                            updateTransferQuantity(ticket.id, (transferItem?.quantity || 0) + 1)
                          }}
                          disabled={transferItem?.quantity === ticket.quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm font-medium">Total a transferir: {totalTicketsToTransfer} tickets</div>
                {totalTicketsToTransfer === 0 && (
                  <div className="text-red-600 text-sm mt-1">
                    Debes seleccionar por lo menos 1 entrada
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Campo de DNI */}
              <div>
                <Label htmlFor="transferDNI">DNI del destinatario</Label>
                <Input
                  id="transferDNI"
                  type="text"
                  placeholder="12345678"
                  value={transferDNI}
                  onChange={(e) => handleDNIChange(e.target.value)}
                  className={`placeholder:text-muted-foreground/50 ${
                    transferDNI.trim() && !isValidatingDNI 
                      ? (isDNIValid ? 'border-green-500' : 'border-red-500') 
                      : ''
                  }`}
                />
                {transferDNI.trim() && !isValidatingDNI && (
                  <p className={`text-xs mt-1 ${isDNIValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isDNIValid ? '✓ DNI válido' : '✗ DNI no válido o usuario no encontrado'}
                  </p>
                )}
                {isValidatingDNI && (
                  <p className="text-xs mt-1 text-muted-foreground">Validando DNI...</p>
                )}
              </div>
              
              {/* Campo de confirmación */}
              <div>
                <Label htmlFor="confirmText">Para confirmar, escribe "TRANSFERIR"</Label>
                <Input
                  id="confirmText"
                  placeholder="TRANSFERIR"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Advertencia */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Importante:</p>
                  <p>Una vez transferidas, las entradas no podrán ser recuperadas. El destinatario será el nuevo propietario.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmTransfer} 
                disabled={!isDNIValid || confirmText !== "TRANSFERIR" || isValidatingDNI || isTransferring || totalTicketsToTransfer === 0}
                className="flex-1"
              >
                {isTransferring ? "Transfiriendo..." : isValidatingDNI ? "Validando..." : "Confirmar Transferencia"}
              </Button>
            </div>
          </div>
        )}


        {currentStep === "success" && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">¡Transferencia Exitosa!</h3>
              <p className="text-muted-foreground">Las entradas han sido transferidas correctamente</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">¿Qué sucede ahora?</h4>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li>• Se ha enviado una notificación al usuario con DNI {transferDNI}</li>
                <li>• Las entradas aparecerán en su cuenta</li>
                <li>• Tus entradas ahora muestran el estado "Transferido"</li>
                <li>• Ya no podrás usar estas entradas</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Entradas transferidas:</h4>
              <div className="text-sm text-muted-foreground">
                {totalTicketsToTransfer} tickets para {selectedTickets.length} evento(s)
              </div>
            </div>

            <Button onClick={handleFinish} className="w-full">
              Finalizar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
