"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProfileData, useProfileForm } from "@/lib/hooks/profile"
import { useUserStore } from "@/lib/stores/user-store"
import { GENERO_OPTIONS } from "@/lib/types/perfil/micuenta"

export function ProfileForm() {
  const router = useRouter()
  const userId = useUserStore((state) => state.user?.id)
  const { profileData, updateProfile, isUpdating } = useProfileData(userId || "")
  const { formData, errors, updateField, validateProfileForm, resetForm, getChangedData, hasChanges } = useProfileForm(profileData || undefined)

  const handleSave = async () => {
    if (!validateProfileForm()) return
    
    const changes = getChangedData(profileData || undefined)
    if (Object.keys(changes).length === 0) return
    
    try {
      await updateProfile(changes)
    } catch (error) {
      
    }
  }

  const handleReset = () => {
    router.push("/perfil")
  }

  return (
    <Card className="rounded-lg border shadow-sm">
      <CardHeader><CardTitle>Información personal</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input 
              id="nombre" 
              value={formData.nombres} 
              onChange={(e) => updateField("nombres", e.target.value)}
              className="border-gray-400 hover:border-gray-500 focus:border-emerald-500 transition-colors"
            />
            {errors.nombres && <p className="text-sm text-red-600 mt-1">{errors.nombres}</p>}
          </div>
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <Input 
              id="apellido" 
              value={formData.apellidos} 
              onChange={(e) => updateField("apellidos", e.target.value)}
              className="border-gray-400 hover:border-gray-500 focus:border-emerald-500 transition-colors"
            />
            {errors.apellidos && <p className="text-sm text-red-600 mt-1">{errors.apellidos}</p>}
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="border-gray-400 hover:border-gray-500 focus:border-emerald-500 transition-colors"
              aria-describedby={errors.email ? "err-email" : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p id="err-email" className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="pais">País</Label>
            <Input 
              id="pais" 
              value="Perú" 
              disabled 
              className="border-gray-300 text-gray-900 font-medium bg-gray-50"
            />
          </div>
          <div>
            <Label>Tipo de documento</Label>
            <div className="text-sm text-gray-700">
              {profileData?.numero_documento 
                ? profileData.numero_documento.length === 8 ? "DNI" : "Carnet de Extranjería"
                : "DNI"
              } 🔒
            </div>
            <p className="text-xs text-gray-500">Dato verificado. Este campo no puede ser modificado.</p>
          </div>
          <div>
            <Label>Número de documento</Label>
            <div className="text-sm text-gray-700">{profileData?.numero_documento || "**********"} 🔒</div>
            <p className="text-xs text-gray-500">Dato verificado. Este campo no puede ser modificado.</p>
          </div>
          <div>
            <Label htmlFor="prefijo">Prefijo</Label>
            <Input 
              id="prefijo" 
              value="+51" 
              disabled 
              className="border-gray-300 text-gray-900 font-medium bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              inputMode="numeric"
              value={formData.telefono}
              onChange={(e) => updateField("telefono", e.target.value.replace(/\D/g, ""))}
              className="border-gray-400 hover:border-gray-500 focus:border-emerald-500 transition-colors"
              aria-describedby={errors.telefono ? "err-telefono" : undefined}
              aria-invalid={!!errors.telefono}
            />
            {errors.telefono && <p id="err-telefono" className="text-sm text-red-600 mt-1">{errors.telefono}</p>}
          </div>
          <div>
            <Label htmlFor="genero">Género</Label>
            <Select value={formData.genero} onValueChange={(value) => updateField("genero", value)}>
              <SelectTrigger className="border-gray-400 hover:border-gray-500 focus:border-emerald-500 transition-colors">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {GENERO_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.genero && <p className="text-sm text-red-600 mt-1">{errors.genero}</p>}
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm h-9 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.recibir_informacion_eventos} 
                onChange={(e) => updateField("recibir_informacion_eventos", e.target.checked)}
                className="w-4 h-4 cursor-pointer" 
              />
              Deseo recibir información de próximos eventos
            </label>
          </div>
        </div>
        <Separator />
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="cursor-pointer">Volver</Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || !hasChanges(profileData || undefined)}
            className="cursor-pointer flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}