import { useMemo } from "react"
import { CheckCircle, XCircle, User } from "lucide-react"
import type { UsuarioDisplay } from "@/lib/types/entities/usuario"

interface StatData {
  title: string
  value: string | number
  icon: any
  iconColor: string
}

export function useUsuariosStats(usuarios: UsuarioDisplay[]): StatData[] {
  const statsData = useMemo(
    () => [
      {
        title: "Total Usuarios",
        value: usuarios?.length || 0,
        icon: User,
        iconColor: "text-primary",
      },
      {
        title: "Usuarios Activos",
        value: (usuarios || []).filter((u) => u.activo).length,
        icon: CheckCircle,
        iconColor: "text-green-600",
      },
      {
        title: "Usuarios Inactivos",
        value: (usuarios || []).filter((u) => !u.activo).length,
        icon: XCircle,
        iconColor: "text-red-600",
      },
    ],
    [usuarios]
  )

  return statsData
}
