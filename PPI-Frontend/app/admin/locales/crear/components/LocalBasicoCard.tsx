"use client"

import { Building, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocalBasicoCardProps } from "@/lib/types/forms"

export function LocalBasicoCard({
  formData,
  tiposLocales,
  errors,
  pageMode,
  onInputChange,
  onSelectChange,
  onErrorClear,
  errorNombre,
  maxLengthNombre
}: LocalBasicoCardProps) {
  return (
    <>
      {/* Nombre del local */}
      <div className="space-y-2 mb-2">
        <Label htmlFor="nombre" className="text-sm font-medium">Nombre del local</Label>
        <div className="relative">
          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="nombre"
            name="nombre"
            placeholder="Ej: Teatro Nacional"
            className={`pl-10 ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}
            value={formData.nombre}
            onChange={onInputChange}
            maxLength={maxLengthNombre}
            required
            disabled={pageMode === 'view'}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span className={errorNombre ? "text-red-600" : "text-gray-500"}>
            {errorNombre || `${formData.nombre.length}/${maxLengthNombre}`}
          </span>
        </div>
      </div>

      {/* Tipo de local */}
      <div className="space-y-2">
        <Label htmlFor="tipo" className="text-sm font-medium">Tipo de local</Label>
        <Select
          value={formData.tipo}
          onValueChange={(value) => {
            onSelectChange("tipo", value)
            onErrorClear("tipo")
          }}
          required
          disabled={pageMode === 'view'}
        >
          <SelectTrigger id="tipo" className={`w-full cursor-pointer ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {tiposLocales.map((tipo) => (
              <SelectItem key={tipo.id} value={tipo.id.toString()} className="cursor-pointer">
                {tipo.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tipo && (
          <p className="text-red-500 text-sm mt-1">{errors.tipo}</p>
        )}
      </div>

      {/* Capacidad */}
      <div className="space-y-2">
        <Label htmlFor="capacidad" className="text-sm font-medium">Capacidad (personas)</Label>
        <div className="relative">
          <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="capacidad"
            name="capacidad"
            type="number"
            placeholder="Ej: 1000"
            className={`pl-10 ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}
            min="1"
            value={formData.capacidad}
            onChange={onInputChange}
            required
            disabled={pageMode === 'view'}
          />
        </div>
      </div>
    </>
  )
}
