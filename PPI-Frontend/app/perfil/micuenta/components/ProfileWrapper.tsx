"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User as UserIcon, Key } from "lucide-react"
import { ProfileForm } from "./ProfileForm"
import { PasswordForm } from "./PasswordForm"
import { useUserInfo, useIsAuthenticated } from "@/lib/stores/auth-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { PageSpinner } from "@/components/ui/page-spinner"

export function ProfileWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userInfo = useUserInfo()
  const isAuthenticated = useIsAuthenticated()
  const initialized = useAuthStore(state => state.initialized)
  const [activeTab, setActiveTab] = useState("info")

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

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'contraseñas' || tabParam === 'password' || tabParam === 'pwd') {
      setActiveTab('pwd')
    }
  }, [searchParams])

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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mi Cuenta</h1>
          <p className="text-gray-600">Modifica tus datos personales y de contacto</p>
        </div>

        {/* Grid de 2 columnas; items-start alinea bordes superiores */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="grid items-start grid-cols-1 md:grid-cols-[260px_1fr] gap-6"
        >
          {/* Sidebar dentro de un Card + sticky */}
          <aside className="md:col-span-1 md:sticky md:top-24 h-fit">
            <Card className="border-0 shadow-none bg-transparent p-0">
              <CardHeader className="pb-2"><CardTitle>Secciones</CardTitle></CardHeader>
              <CardContent className="p-3">
                <TabsList className="flex w-full flex-col gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="info"
                    className="w-full justify-start gap-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4" /> Información personal
                  </TabsTrigger>
                  <TabsTrigger
                    value="pwd"
                    className="w-full justify-start gap-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 cursor-pointer"
                  >
                    <Key className="h-4 w-4" /> Contraseña
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
          </aside>

          {/* Contenido; cada TabContent con scroll offset */}
          <TabsContent value="info" className="md:col-span-1 scroll-mt-24">
            <ProfileForm />
          </TabsContent>

          <TabsContent value="pwd" className="md:col-span-1 scroll-mt-24">
            <PasswordForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}