"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocalUbicacionCardProps } from "@/lib/types/forms"

export function LocalUbicacionCard({
  formData,
  departamentos,
  provincias,
  distritos,
  errors,
  pageMode,
  onSelectChange,
  onErrorClear,
  onDepartamentoChange,
  onProvinciaChange
}: LocalUbicacionCardProps) {
  return (
    <>
      {/* Departamento */}
      <div className="space-y-2">
       <Label htmlFor="departamento" className="text-sm font-medium">Departamento</Label>
        <Select
          value={formData.departamento}
          onValueChange={(value) => {
            onSelectChange("departamento", value)
            onErrorClear("departamento")
            onDepartamentoChange?.(value)
          }}
          required
          disabled={pageMode === 'view'}
        >
          <SelectTrigger id="departamento" className={`w-full cursor-pointer ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
            <SelectValue placeholder="Seleccionar departamento" />
          </SelectTrigger>
          <SelectContent>
            {departamentos.map((departamento) => (
              <SelectItem key={departamento.id} value={departamento.id.toString()} className="cursor-pointer">
                {departamento.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departamento && (
          <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
        )}
      </div>

      {/* Provincia */}
      <div className="space-y-2">
        <Label htmlFor="provincia" className="text-sm font-medium">Provincia</Label>
          <Select
            value={formData.provincia}
            onValueChange={(value) => {
              onSelectChange("provincia", value)
              onErrorClear("provincia")
              onProvinciaChange?.(value)
            }}
            required
            disabled={pageMode === 'view' || !formData.departamento}
          >
            <SelectTrigger id="provincia" className={`w-full cursor-pointer ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
              <SelectValue placeholder={formData.departamento ? "Seleccionar provincia" : "Primero seleccione un departamento"} />
            </SelectTrigger>
            <SelectContent>
                {provincias.map((provincia) => (
                  <SelectItem key={provincia.id} value={provincia.id.toString()} className="cursor-pointer">
                    {provincia.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.provincia && (
            <p className="text-red-500 text-sm mt-1">{errors.provincia}</p>
          )}
      </div>

      {/* Distrito */}
      <div className="space-y-2">
        <Label htmlFor="distrito" className="text-sm font-medium">Distrito</Label>
          <Select
            value={formData.distrito}
            onValueChange={(value) => {
              onSelectChange("distrito", value)
              onErrorClear("distrito")
            }}
            required
            disabled={pageMode === 'view' || !formData.provincia}
          >
            <SelectTrigger id="distrito" className={`w-full cursor-pointer ${pageMode === 'view' ? '!opacity-100 !bg-white !text-gray-900' : ''}`}>
              <SelectValue placeholder={formData.provincia ? "Seleccionar distrito" : "Primero seleccione una provincia"} />
            </SelectTrigger>
            <SelectContent>
                {distritos.map((distrito) => (
                  <SelectItem key={distrito.distrito_id} value={distrito.distrito_id.toString()} className="cursor-pointer">
                    {distrito.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.distrito && (
            <p className="text-red-500 text-sm mt-1">{errors.distrito}</p>
          )}
      </div>
    </>
  )
}
