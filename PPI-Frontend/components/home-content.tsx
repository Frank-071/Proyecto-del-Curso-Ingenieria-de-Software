"use client"

import { useEffect, useState } from "react"
import { useEventosPublicos } from "@/lib/stores/eventos-store"
import { useFiltrosData } from "@/lib/hooks/home/use-filtros-data"
import { SearchSection } from "@/components/search-section"
import { FeaturedCarousel } from "@/components/featured-carousel"
import { UpcomingEvents } from "@/components/upcoming-events"
import { PageSpinner } from "@/components/ui/page-spinner"

const LOADING_TIMEOUT_MS = 10000 // 10 segundos

export function HomeContent() {
  const { initialized, cargarEventos, error: eventosError, filtros } = useEventosPublicos()
  const { isReady: filtrosReady } = useFiltrosData()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Cargar eventos iniciales SOLO una vez
  useEffect(() => {
    if (!initialized) {
      cargarEventos(filtros)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timeout para evitar loading infinito
  useEffect(() => {
    if (!initialized || !filtrosReady) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
      }, LOADING_TIMEOUT_MS)

      return () => clearTimeout(timer)
    } else {
      setLoadingTimeout(false)
    }
  }, [initialized, filtrosReady])

  // Mostrar spinner mientras se cargan los datos iniciales (con timeout)
  if ((!initialized || !filtrosReady) && !loadingTimeout) {
    return <PageSpinner message="Cargando eventos..." />
  }

  // Determinar si hay error
  const hasError = loadingTimeout || !!eventosError

  return (
    <main className="space-y-12 pb-12">
      <FeaturedCarousel hasError={hasError} />
      <SearchSection />
      <UpcomingEvents hasError={hasError} />
    </main>
  )
}