import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, QrCode } from "lucide-react"

interface PaymentMethodSelectorProps {
  paymentMethod: "card" | "qr"
  onPaymentMethodChange: (value: "card" | "qr") => void
}

// Componentes de iconos de tarjetas usando las imágenes reales
const VisaIcon = () => (
  <img 
    src="/visa.png" 
    alt="Visa" 
    className="h-7 w-11 object-contain"
  />
)

const MastercardIcon = () => (
  <img 
    src="/ma_symbol_opt_73_3x.png" 
    alt="Mastercard" 
    className="h-7 w-11 object-contain"
  />
)

// Componentes de iconos de pagos digitales
const YapeIcon = () => (
  <img 
    src="/yape.svg" 
    alt="Yape" 
    className="h-7 w-11 object-contain"
  />
)

const PlinIcon = () => (
  <img 
    src="/plin.png" 
    alt="Plin" 
    className="h-7 w-11 object-contain"
  />
)

export function PaymentMethodSelector({ paymentMethod, onPaymentMethodChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold">Método de pago</h2>
      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => onPaymentMethodChange(value as "card" | "qr")}
      >
        <div className={`flex items-center space-x-2 sm:space-x-3 cursor-pointer p-3 sm:p-4 rounded-lg border-2 transition-all ${
          paymentMethod === "card" 
            ? "border-primary bg-primary/5" 
            : "border-gray-200 hover:border-gray-300"
        }`}>
          <RadioGroupItem value="card" id="card" className="cursor-pointer flex-shrink-0" />
          <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Tarjeta de crédito/débito</span>
            <div className="flex items-center ml-auto -space-x-1 flex-shrink-0">
              <VisaIcon />
              <MastercardIcon />
            </div>
          </Label>
        </div>
        <div className={`flex items-center space-x-2 sm:space-x-3 cursor-pointer p-3 sm:p-4 rounded-lg border-2 transition-all ${
          paymentMethod === "qr" 
            ? "border-primary bg-primary/5" 
            : "border-gray-200 hover:border-gray-300"
        }`}>
          <RadioGroupItem value="qr" id="qr" className="cursor-pointer flex-shrink-0" />
          <Label htmlFor="qr" className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate">Código QR (Yape, Plin)</span>
            <div className="flex items-center ml-auto -space-x-1 flex-shrink-0">
              <YapeIcon />
              <PlinIcon />
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
