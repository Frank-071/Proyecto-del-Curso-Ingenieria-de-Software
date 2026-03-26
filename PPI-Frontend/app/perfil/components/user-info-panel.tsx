"use client"

import { useCallback, useState } from "react"
import { useAuth } from "@/lib/hooks/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, CalendarCheck, LogOut, Coins } from "lucide-react"
import { UserInfoPanelProps } from "@/lib/types/perfil"
import { ProfileAvatar } from "./profile-avatar"
import { UserInfoItem } from "./user-info-item"
import { authService } from "@/lib/api/services/auth/auth"
import { useRouter } from "next/navigation"

export function UserInfoPanel({ userId, email, rank, validTicketsCount, profileImage, currentPoints, proximoEvento, pointsLoading }: UserInfoPanelProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [isClosingSessions, setIsClosingSessions] = useState(false)

  const handleCloseAllSessions = useCallback(async () => {
    try {
      setIsClosingSessions(true)
      await authService.closeAllSessions()
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Error cerrando todas las sesiones:', error)
      alert('Error al cerrar todas las sesiones. Por favor, intenta nuevamente.')
    } finally {
      setIsClosingSessions(false)
    }
  }, [logout, router])

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900">Información del Usuario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProfileAvatar
          userId={userId}
          email={email}
          rank={rank}
          profileImage={profileImage}
        />

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Correo electrónico</p>
            <UserInfoItem icon={Mail} label={email} />
          </div>
          
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Puntos acumulados</p>
            <UserInfoItem 
              icon={Coins} 
              value={pointsLoading ? "..." : currentPoints.toLocaleString()} 
              label="puntos disponibles" 
            />
          </div>
          
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Próximo evento</p>
            {pointsLoading ? (
              <UserInfoItem icon={CalendarCheck} label="Cargando..." />
            ) : proximoEvento ? (
              <div className="flex items-start gap-3 text-gray-700">
                <CalendarCheck className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{proximoEvento.nombre}</p>
                  <p className="text-sm text-gray-600">{proximoEvento.fecha} • {proximoEvento.hora}</p>
                </div>
              </div>
            ) : (
              <UserInfoItem icon={CalendarCheck} label="Sin eventos próximos" />
            )}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-6 flex items-center justify-center gap-2 bg-white border border-gray-300 text-red-600 hover:bg-red-100 cursor-pointer disabled:opacity-50"
          onClick={handleCloseAllSessions}
          disabled={isClosingSessions}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{isClosingSessions ? 'Cerrando sesiones...' : 'Cerrar todas las sesiones'}</span>
        </Button>
      </CardContent>
    </Card>
  )
}

