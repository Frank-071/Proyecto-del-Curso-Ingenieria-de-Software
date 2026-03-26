"use client"

import { CheckCircle, XCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LocalEstadoCardProps } from "@/lib/types/forms"

export function LocalEstadoCard({
  formData,
  pageMode,
  onSelectChange
}: LocalEstadoCardProps) {
  return (
    <div className="space-y-2 md:col-span-2 mb-3">
      <div className={`flex flex-row items-center justify-between rounded-lg border ${formData.estado ? 'border-primary/20' : 'border-gray-200'} p-3 shadow-sm`}>
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Estado del local</Label>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
            {formData.estado ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={formData.estado ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
              {formData.estado ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
        <div className="flex items-center h-10">
          <Switch
            checked={formData.estado}
            onCheckedChange={(checked) => onSelectChange("estado", checked)}
            className={`data-[state=unchecked]:bg-gray-300 hover:data-[state=unchecked]:bg-gray-400 data-[state=checked]:bg-primary ${pageMode === 'view' ? '!opacity-100' : ''}`}
            disabled={pageMode === 'view'}
          />
        </div>
      </div>
    </div>
  )
}
