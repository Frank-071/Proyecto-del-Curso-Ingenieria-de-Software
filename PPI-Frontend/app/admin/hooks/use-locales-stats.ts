import { useMemo } from 'react'
import { MapPin, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import type { LocalDisplay } from '@/lib/types/entities/local'

interface StatData {
  title: string
  value: string | number
  icon: any
  iconColor: string
}

export function useLocalesStats(locales: LocalDisplay[]): StatData[] {
  const tipoMasComun = useMemo(() => {
    if (!locales || locales.length === 0) return "N/A"
    
    const conteo = locales.reduce((acc, local) => {
      acc[local.tipo] = (acc[local.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const tipoMax = Object.entries(conteo).reduce((max, [tipo, count]) => 
      count > max.count ? { tipo, count } : max
    , { tipo: "N/A", count: 0 })
    
    return tipoMax.tipo
  }, [locales])

  const statsData = useMemo(() => [
    {
      title: "Total Locales",
      value: locales?.length || 0,
      icon: MapPin,
      iconColor: "text-primary"
    },
    {
      title: "Locales Activos",
      value: (locales || []).filter((local) => local.estado === "Activo").length,
      icon: CheckCircle,
      iconColor: "text-green-600"
    },
    {
      title: "Locales Inactivos",
      value: (locales || []).filter((local) => local.estado === "Inactivo").length,
      icon: XCircle,
      iconColor: "text-red-600"
    },
    {
      title: "Tipo Más Común",
      value: tipoMasComun,
      icon: TrendingUp,
      iconColor: "text-accent"
    }
  ], [locales, tipoMasComun])

  return statsData
}

