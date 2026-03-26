"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useProfileData, usePasswordForm } from "@/lib/hooks/profile"
import { useUserStore } from "@/lib/stores/user-store"
import { tokenUtils } from "@/lib/auth/token"
import { Check, Circle } from "lucide-react"

export function PasswordForm() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const storeUserId = useUserStore((state) => state.user?.id)
  
  // Obtener user ID desde el store o del token como fallback
  useEffect(() => {
    const getUserId = async () => {
      if (storeUserId) {
        setUserId(String(storeUserId))
      } else {
        // Fallback: obtener del token JWT
        const tokenUserId = await tokenUtils.getUserId()
        if (tokenUserId) {
          setUserId(tokenUserId)
        }
      }
    }
    getUserId()
  }, [storeUserId])
  
  const { updatePassword, isPasswordUpdating } = useProfileData(userId)
  const { passwordData, passwordErrors, updatePasswordField, validatePasswordForm, resetPasswordForm } = usePasswordForm()

  const handleSave = async () => {
    if (!validatePasswordForm()) return
    
    try {
      await updatePassword(passwordData)
      resetPasswordForm()
    } catch (error) {
      
    }
  }

  const handleBack = () => {
    router.push("/perfil")
  }

  // Local UI state: toggles for showing password values
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)

  // Checklist computed from the new password value
  const { lengthOk, upperOk, lowerOk, digitOk } = useMemo(() => {
    const val = passwordData.new_password || ""
    return {
      lengthOk: val.length >= 8,
      upperOk: /[A-Z]/.test(val),
      lowerOk: /[a-z]/.test(val),
      digitOk: /[0-9]/.test(val),
    }
  }, [passwordData.new_password])

  const allRequirementsMet = lengthOk && upperOk && lowerOk && digitOk
  const passwordsMatch = passwordData.new_password && passwordData.new_password === passwordData.confirm_password
  const formValid = allRequirementsMet && passwordsMatch && !!passwordData.current_password

  return (
    <Card className="rounded-lg border shadow-sm">
      <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 items-stretch">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start md:items-center">
              <div className="w-full">
                <Label htmlFor="pwdCurrent">Contraseña actual</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="pwdCurrent" 
                    type={showCurrent ? "text" : "password"} 
                    value={passwordData.current_password} 
                    className="w-full border border-gray-200 rounded-md focus:border-emerald-300"
                    onChange={(e) => updatePasswordField("current_password", e.target.value)} 
                    aria-describedby={passwordErrors.current_password ? "err-pwd-current" : undefined} 
                    aria-invalid={!!passwordErrors.current_password} 
                  />
                  <button type="button" onClick={() => setShowCurrent((s) => !s)} className="text-sm text-gray-700 px-3 py-1 rounded-md border bg-emerald-50 hover:bg-emerald-100 cursor-pointer">
                    {showCurrent ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {passwordErrors.current_password && <p id="err-pwd-current" className="text-sm text-red-600 mt-1">{passwordErrors.current_password}</p>}
              </div>
              <div className="w-full" />
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <Label htmlFor="pwdNew">Contraseña nueva</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pwdNew"
                    type={showNew ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => updatePasswordField("new_password", e.target.value)}
                    aria-describedby={passwordErrors.new_password ? "err-pwd-new" : undefined}
                    aria-invalid={!!passwordErrors.new_password}
                    className="w-full border border-gray-200 rounded-md focus:border-emerald-300"
                  />
                  <button type="button" onClick={() => setShowNew((s) => !s)} className="text-sm text-gray-700 px-3 py-1 rounded-md border bg-emerald-50 hover:bg-emerald-100 cursor-pointer">
                    {showNew ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {passwordErrors.new_password && <p id="err-pwd-new" className="text-sm text-red-600 mt-1">{passwordErrors.new_password}</p>}
              </div>

              <div className="w-full">
                <Label htmlFor="pwdRepeat">Repetir contraseña</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pwdRepeat"
                    type={showRepeat ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => updatePasswordField("confirm_password", e.target.value)}
                    aria-describedby={passwordErrors.confirm_password ? "err-pwd-repeat" : undefined}
                    aria-invalid={!!passwordErrors.confirm_password}
                    className="w-full border border-gray-200 rounded-md focus:border-emerald-300"
                  />
                  <button type="button" onClick={() => setShowRepeat((s) => !s)} className="text-sm text-gray-700 px-3 py-1 rounded-md border bg-emerald-50 hover:bg-emerald-100 cursor-pointer">
                    {showRepeat ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {passwordErrors.confirm_password && <p id="err-pwd-repeat" className="text-sm text-red-600 mt-1">{passwordErrors.confirm_password}</p>}
              </div>
            </div>

            <div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  {lengthOk ? <Check className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-gray-300" />}
                  <span className={lengthOk ? "text-emerald-700" : ""}>Mínimo 8 caracteres</span>
                </li>
                <li className="flex items-center gap-2">
                  {upperOk ? <Check className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-gray-300" />}
                  <span className={upperOk ? "text-emerald-700" : ""}>Al menos 1 mayúscula</span>
                </li>
                <li className="flex items-center gap-2">
                  {lowerOk ? <Check className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-gray-300" />}
                  <span className={lowerOk ? "text-emerald-700" : ""}>Al menos 1 minúscula</span>
                </li>
                <li className="flex items-center gap-2">
                  {digitOk ? <Check className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-gray-300" />}
                  <span className={digitOk ? "text-emerald-700" : ""}>Al menos 1 dígito</span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordsMatch ? <Check className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-gray-300" />}
                  <span className={passwordsMatch ? "text-emerald-700" : ""}>Las contraseñas coinciden</span>
                </li>
              </ul>
            </div>
          </div>

        <Separator />
        <div className="flex gap-3">
          <Button variant="outline" className="cursor-pointer" onClick={handleBack} disabled={isPasswordUpdating}>Volver</Button>
          <Button className="cursor-pointer" onClick={handleSave} disabled={isPasswordUpdating || !formValid}>
            {isPasswordUpdating ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
