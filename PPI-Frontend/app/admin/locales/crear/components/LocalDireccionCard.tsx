"use client"

import { MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LocalDireccionCardProps } from "@/lib/types/forms"

export function LocalDireccionCard({
  formData,
  pageMode,
  onInputChange,
  onErrorClear,
  errorDireccion,
  maxLengthDireccion
}: LocalDireccionCardProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="direccion" className="text-sm font-medium">Dirección completa</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="direccion"
          name="direccion"
          placeholder="Ej: Av. Javier Prado 1234, San Isidro"
          className={`pl-10 ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}
          value={formData.direccion}
          onChange={onInputChange}
          maxLength={maxLengthDireccion}
          required
          disabled={pageMode === 'view'}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span className={errorDireccion ? "text-red-600" : "text-gray-500"}>
          {errorDireccion || `${formData.direccion.length}/${maxLengthDireccion}`}
        </span>
      </div>
    </div>
  )
}
