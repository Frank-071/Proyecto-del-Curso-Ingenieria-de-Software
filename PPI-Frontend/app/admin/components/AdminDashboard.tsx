"use client"

import { useAuth } from "@/lib/hooks/auth"
import { useAdminStats } from "@/lib/hooks/admin/use-admin-stats"
import { useUserStore } from "@/lib/stores/user-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageSpinner } from "@/components/ui/page-spinner"
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Mail,
  Hash,
  Clock,
  LogOut,
  Home,
  Bug,
} from "lucide-react"
import Link from "next/link"

const formatJoinDate = (dateInput: string | number | undefined) => {
  if (!dateInput) return "No disponible"
  try {
    const date = new Date(typeof dateInput === "number" ? dateInput * 1000 : dateInput)
    if (isNaN(date.getTime())) return "Fecha inválida"
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return "Fecha inválida"
  }
}

const getInitials = (name: string | undefined) => {
  if (!name || typeof name !== "string") return "A"
  const nameParts = name.split(" ").slice(0, 2)
  return nameParts.map((n) => n[0]).join("").toUpperCase()
}

export function AdminDashboard() {
  const { logout, userInfo, isLoading: authLoading } = useAuth()
  const { stats, loading: statsLoading } = useAdminStats()
  const user = useUserStore((state) => state.user)

  // Mostrar el loader mientras se cargan los datos del backend
  if (authLoading || !userInfo || statsLoading) {
    return <PageSpinner message="Cargando panel de administración..." />
  }

  const userProfile = {
    email: userInfo.email,
    id: userInfo.sub ? `ADM${userInfo.sub}` : "Sin ID",
    nombre: stats?.adminName || user?.name || "Administrador",
    rol: userInfo.role || "Usuario",
    fecha_creacion: stats?.fechaCreacion || userInfo.iat,
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold" style={{ color: "#1f2937" }}>
                Panel de Administración
              </h1>
              <p className="mt-2" style={{ color: "#6b7280" }}>
                Gestiona el sistema PatasPepasSoft desde aquí
              </p>
            </div>
            <Link href="/" className="w-full md:w-auto md:shrink-0">
              <Button
                variant="outline"
                aria-label="Volver al inicio"
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-transparent"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff"
                }}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Volver al inicio</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda: info admin */}
        <div className="lg:col-span-1">
          <Card
            className="border border-gray-200"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: "#1f2937" }}>
                Información del Administrador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-24 h-24 mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: "#059669", color: "#ffffff" }}
                >
                  {getInitials(userProfile.nombre)}
                </div>
                <h3
                  className="text-xl font-semibold"
                  style={{ color: "#1f2937" }}
                >
                  {userProfile.nombre}
                </h3>
                <Badge
                  className="mt-2"
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                  }}
                >
                  {userProfile.rol}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" style={{ color: "#6b7280" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {userProfile.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4" style={{ color: "#6b7280" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    ID: {userProfile.id}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" style={{ color: "#6b7280" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    Registrado: {formatJoinDate(userProfile.fecha_creacion)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-6 flex items-center justify-center gap-2 bg-transparent"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#dc2626",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fee2e2"
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff"
                }}
                onClick={async () => {
                  await logout()
                }}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: stats + botones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8" style={{ color: "#059669" }} />
                  <div className="ml-3">
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Locales
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#1f2937" }}>
                      {stats?.totalLocales ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8" style={{ color: "#2563eb" }} />
                  <div className="ml-3">
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Eventos
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#1f2937" }}>
                      {stats?.totalEventos ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8" style={{ color: "#7c3aed" }} />
                  <div className="ml-3">
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Usuarios
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#1f2937" }}>
                      {stats?.totalUsuarios ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8" style={{ color: "#10b981" }} />
                  <div className="ml-3">
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Eventos Publicados
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#1f2937" }}>
                      {stats?.eventosActivos ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opciones */}
          <Card style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
            <CardHeader>
              <CardTitle style={{ color: "#1f2937" }}>
                Opciones de Administración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/locales">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#22c55e",
                      border: "1px solid #22c55e",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <MapPin className="w-6 h-6" />
                    <span className="font-medium">Locales</span>
                  </Button>
                </Link>

                <Link href="/admin/eventos">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#22c55e",
                      border: "1px solid #22c55e",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <Calendar className="w-6 h-6" />
                    <span className="font-medium">Eventos</span>
                  </Button>
                </Link>

                <Link href="/admin/users">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#22c55e",
                      border: "1px solid #22c55e",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <Users className="w-6 h-6" />
                    <span className="font-medium">Usuarios</span>
                  </Button>
                </Link>

                <Link href="/admin/AuditoriaReporteria">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 md:col-span-2"
                    style={{
                      backgroundColor: "#22c55e",
                      border: "1px solid #22c55e",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-medium">
                      Auditoría y Reportes
                    </span>
                  </Button>
                </Link>

                <Link href="/admin/logs">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 md:col-span-2"
                    style={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #0f172a",
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <Bug className="w-6 h-6" />
                    <span className="font-medium">Logs de errores</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}



