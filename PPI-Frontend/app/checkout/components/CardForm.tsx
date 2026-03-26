import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus } from "lucide-react"
import type { SavedPaymentMethod } from "@/lib/types/auth/user"

interface CardFormProps {
  savedPaymentMethods: SavedPaymentMethod[]
  selectedSavedCard: string
  useNewCard: boolean
  cardForm: {
    cardNumber: string
    expiryDate: string
    cvv: string
    cardName: string
  }
  savePaymentMethod: boolean
  onSavedCardSelect: (cardId: string) => void
  onUseNewCard: () => void
  onCardFormChange: (field: string, value: string) => void
  onSavePaymentMethodChange: (value: boolean) => void
}

export function CardForm({
  savedPaymentMethods,
  selectedSavedCard,
  useNewCard,
  cardForm,
  savePaymentMethod,
  onSavedCardSelect,
  onUseNewCard,
  onCardFormChange,
  onSavePaymentMethodChange,
}: CardFormProps) {
  // Filtrar solo tarjetas guardadas (type === "card")
  const savedCards = savedPaymentMethods.filter(method => method.type === "card")

  return (
    <div className="space-y-4 border rounded-lg p-3 sm:p-4">
      {savedCards.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tarjetas guardadas</Label>
          {savedCards.map((method) => (
            <div
              key={method.id}
              className={`flex items-center justify-between p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedSavedCard === method.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => onSavedCardSelect(method.id)}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedSavedCard === method.id ? "border-primary" : "border-muted-foreground"
                  }`}
                >
                  {selectedSavedCard === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base truncate">{method.cardNumber || "**** **** **** ****"}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{method.cardHolder || "Tarjeta"}</p>
                </div>
              </div>
              {method.isDefault && (
                <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                  Por defecto
                </Badge>
              )}
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={onUseNewCard} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Usar nueva tarjeta
          </Button>
        </div>
      )}

      {(savedCards.length === 0 || useNewCard) && (
        <div className="space-y-4">
          {savedCards.length > 0 && <Label className="text-sm font-medium">Nueva tarjeta</Label>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="cardNumber" className="text-sm">Número de tarjeta</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardForm.cardNumber}
                onChange={(e) => onCardFormChange("cardNumber", e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate" className="text-sm">Fecha de vencimiento</Label>
              <Input
                id="expiryDate"
                placeholder="MM/AA"
                value={cardForm.expiryDate}
                onChange={(e) => onCardFormChange("expiryDate", e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="cvv" className="text-sm">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cardForm.cvv}
                onChange={(e) => onCardFormChange("cvv", e.target.value)}
                className="w-full"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="cardName" className="text-sm">Nombre en la tarjeta</Label>
              <Input
                id="cardName"
                placeholder="Juan Pérez"
                value={cardForm.cardName}
                onChange={(e) => onCardFormChange("cardName", e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="savePayment"
              checked={savePaymentMethod}
              onCheckedChange={(checked) => onSavePaymentMethodChange(checked as boolean)}
              className="cursor-pointer flex-shrink-0"
            />
            <Label htmlFor="savePayment" className="text-xs sm:text-sm cursor-pointer">
              Guardar esta tarjeta para futuras compras
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
