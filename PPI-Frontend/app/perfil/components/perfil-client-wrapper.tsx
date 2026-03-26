"use client"

import { useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/lib/stores/user-store"
import { UserInfoPanel } from "./user-info-panel"
import { UserStatsCards } from "./user-stats-cards"
import { ProfileOptions } from "./profile-options"
import { Header } from "@/components/header"
import { PageSpinner } from "@/components/ui/page-spinner"
import { useProfilePhotoLoader } from "@/lib/hooks/profile"
import { useClientPoints } from "@/lib/hooks/profile/use-client-points"
import { useUserInfo, useIsAuthenticated } from "@/lib/stores/auth-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function PerfilClientWrapper() {
  const router = useRouter()
  const user = useUserStore(state => state.user)
  const userInfo = useUserInfo()
  const isAuthenticated = useIsAuthenticated()
  const initialized = useAuthStore(state => state.initialized)
  const { loading: isLoadingPhoto } = useProfilePhotoLoader(user?.id)
  const { currentPoints, totalPointsEarned, totalTickets, proximoEvento, loading: isLoadingPoints } = useClientPoints()

  // Derived ticket stats (useMemo must be called unconditionally to preserve hook order)
  const validTicketsCount = useMemo(() => {
    if (!user) {
      return 0
    }

    const now = new Date()
    return user.purchasedTickets.filter(
      t => !t.isUsed && new Date(t.eventDate) > now
    ).length
  }, [user?.purchasedTickets])

  useEffect(() => {
    const checkAuth = async () => {
      if (!initialized) {
        await useAuthStore.getState().initializeAuth()
        return
      }

      if (!isAuthenticated) {
        const currentUrl = window.location.pathname + window.location.search
        router.push(`/login?returnUrl=${encodeURIComponent(currentUrl)}`)
        return
      }

      if (userInfo?.role === 'admin') {
        router.push('/')
        return
      }
    }

    checkAuth()
  }, [isAuthenticated, userInfo, router, initialized])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <PageSpinner message="Verificando autenticación..." />
      </div>
    )
  }

  if (!isAuthenticated || userInfo?.role === 'admin') {
    return null
  }

  

  // Esperar a que tanto la foto como los datos de puntos/tickets estén cargados
  const isLoading = isLoadingPhoto || isLoadingPoints
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <PageSpinner message="Cargando perfil..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No hay información de usuario
          </h1>
          <p className="text-gray-600 mb-6">
            Por favor, inicia sesión para ver tu perfil.
          </p>
          <Link href="/login">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Ir a Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu información personal y entradas
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <UserInfoPanel 
              userId={user.id}
              email={user.email}
              rank={user.rank}
              validTicketsCount={validTicketsCount}
              profileImage={user.profileImage}
              currentPoints={currentPoints}
              proximoEvento={proximoEvento}
              pointsLoading={isLoadingPoints}
            />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <UserStatsCards 
              discount={user.rankDiscount}
              totalPointsEarned={totalPointsEarned}
              totalTickets={totalTickets}
              pointsLoading={isLoadingPoints}
            />
            
            <ProfileOptions />
          </div>
        </div>
      </main>
    </div>
  )
}

