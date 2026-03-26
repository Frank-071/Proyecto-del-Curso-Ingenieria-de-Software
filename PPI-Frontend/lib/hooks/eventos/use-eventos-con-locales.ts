import { useState, useEffect, useCallback, useRef } from 'react'
import { useEventos } from '@/lib/hooks/eventos'
import { localesService } from '@/lib/api/services/locales'
import { EventoResponse } from '@/lib/types/entities/evento'
import { LocalResponse } from '@/lib/types/entities/local'

export interface EventoConLocal extends EventoResponse {
  localInfo?: LocalResponse
  id?: number // Permitir compatibilidad con backend que devuelve 'id'
}

// Cache global para evitar múltiples llamadas
let eventosCache: EventoConLocal[] = []
let localesCache: LocalResponse[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const useEventosConLocales = () => {
  const [eventosConLocales, setEventosConLocales] = useState<EventoConLocal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)
  
  const { listarEventos } = useEventos()

  // Función optimizada que carga todo de una vez
  const cargarTodosLosEventos = useCallback(async () => {
    // Verificar cache
    const now = Date.now()
    if (eventosCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('� Usando cache de eventos')
      setEventosConLocales(eventosCache)
      return { success: true, data: eventosCache }
    }

    if (loading) return { success: false, detail: 'Cargando...' }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Cargando todos los datos...')
      
      // Primero cargar locales si no están en cache
      if (localesCache.length === 0) {
        console.log('📡 Cargando locales desde API...')
        try {
          const localesResult = await localesService.listar()
          console.log('🔍 Respuesta completa de locales:', localesResult)
          
          // Verificar diferentes estructuras de respuesta
          if (Array.isArray(localesResult)) {
            // Respuesta directa como array
            localesCache = localesResult as LocalResponse[]
          } else if (localesResult.success && localesResult.data) {
            // Respuesta envuelta en objeto success
            localesCache = localesResult.data as LocalResponse[]
          } else if (localesResult.data && Array.isArray(localesResult.data)) {
            // Respuesta con data array
            localesCache = localesResult.data as LocalResponse[]
          } else {
            console.warn('⚠️ Estructura de respuesta no reconocida:', localesResult)
            localesCache = []
          }
          
          console.log(`✅ Locales cargados: ${localesCache.length}`)
        
          // Mostrar estructura de los primeros locales para debug
          if (localesCache.length > 0) {
            console.log('🏢 Primeros locales cargados:')
            localesCache.slice(0, 3).forEach(local => {
              console.log(`  - ID: ${local.id}, Nombre: "${local.nombre}"`)
            })
          }
        } catch (localError) {
          console.warn('⚠️ Error de conexión con locales, continuando sin locales:', localError)
          localesCache = []
        }
      }
      
      // Luego cargar eventos
      console.log('📡 Cargando eventos...')
      const eventosResult = await listarEventos(0, 100)
      
      if (eventosResult.success && 'data' in eventosResult && eventosResult.data) {
        const eventos = eventosResult.data as EventoResponse[]
        console.log(`✅ Cargados ${eventos.length} eventos`)
        console.log(`📍 Locales disponibles: ${localesCache.length}`)
        
        // Crear mapa de locales para búsqueda rápida
        const localesMap = new Map<number, LocalResponse>()
        localesCache.forEach(local => {
          localesMap.set(local.id, local)
          console.log(`🏢 Local mapeado: ${local.id} -> ${local.nombre}`)
        })
        
        // Combinar eventos con información de locales
        const eventosCompletos: EventoConLocal[] = eventos.map(evento => {
          const localInfo = localesMap.get(evento.local_id)
          if (localInfo) {
            console.log(`✅ Evento "${evento.nombre}" -> Local "${localInfo.nombre}"`)
          } else {
            console.warn(`⚠️ Local ${evento.local_id} no encontrado para evento "${evento.nombre}"`)
          }
          
          return {
            ...evento,
            localInfo
          }
        })
        
        console.log('🎯 Eventos completos con locales:', eventosCompletos)
        
        // Actualizar cache
        eventosCache = eventosCompletos
        cacheTimestamp = now
        
        setEventosConLocales(eventosCompletos)
        return { success: true, data: eventosCompletos }
      } else {
        throw new Error('No se pudieron cargar los eventos')
      }
    } catch (error) {
      console.error('💥 Error cargando eventos:', error)
      let errorMsg = 'Error cargando eventos'
      
      if (error instanceof Error) {
        errorMsg = error.message
      }
      
      // Si es un error de locales, no fallar completamente
      if (errorMsg.includes('local')) {
        console.warn('⚠️ Error de locales, pero continuando con eventos básicos')
        // Intentar cargar solo eventos sin locales
        try {
          const eventosResult = await listarEventos(0, 100)
          if (eventosResult.success && 'data' in eventosResult && eventosResult.data) {
            const eventos = eventosResult.data as EventoResponse[]
            const eventosBasicos: EventoConLocal[] = eventos.map(evento => ({ ...evento }))
            
            eventosCache = eventosBasicos
            cacheTimestamp = Date.now()
            setEventosConLocales(eventosBasicos)
            return { success: true, data: eventosBasicos }
          }
        } catch (fallbackError) {
          console.error('💥 Error también en fallback:', fallbackError)
        }
      }
      
      setError(errorMsg)
      return { success: false, detail: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [listarEventos, loading])

  // Funciones que filtran del cache local
  const obtenerEventosDestacados = useCallback(() => {
    const destacados = eventosConLocales.slice(0, 3)
    return { success: true, data: destacados }
  }, [eventosConLocales])

  const obtenerEventosProximos = useCallback(() => {
    return { success: true, data: eventosConLocales }
  }, [eventosConLocales])

  const obtenerEventosRecomendados = useCallback(() => {
    const recomendados = eventosConLocales.slice(3, 9)
    return { success: true, data: recomendados }
  }, [eventosConLocales])

  // Cargar datos una sola vez al montar
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      cargarTodosLosEventos()
    }
  }, [cargarTodosLosEventos])

  return {
    eventosConLocales,
    loading,
    error,
    cargarTodosLosEventos,
    obtenerEventosDestacados,
    obtenerEventosProximos,
    obtenerEventosRecomendados,
    setError
  }
}