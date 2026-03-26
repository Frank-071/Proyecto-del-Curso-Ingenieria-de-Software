"use client"

import { useState, useEffect, useRef } from "react"
import { categoriasEventoService } from "@/lib/api/services/eventos"
import { distritosService } from "@/lib/api/services/geografia"
import { CategoriaEvento } from "@/lib/types/entities/categoria-evento"
import { Distrito } from "@/lib/types/entities/distrito"

interface UseFiltrosDataReturn {
  categorias: CategoriaEvento[]
  distritos: Distrito[]
  loading: boolean
  error: string | null
  isReady: boolean
}

// Cache global compartido para todos los componentes
let cacheGlobal: {
  categorias: CategoriaEvento[]
  distritos: Distrito[]
  loading: boolean
  isReady: boolean
  promise: Promise<{ categorias: CategoriaEvento[], distritos: Distrito[] }> | null
  subscribers: Set<() => void>
} = {
  categorias: [],
  distritos: [],
  loading: true,
  isReady: false,
  promise: null,
  subscribers: new Set()
}

// Función para notificar a todos los subscribers
function notifySubscribers() {
  cacheGlobal.subscribers.forEach(callback => callback())
}

export function useFiltrosData(): UseFiltrosDataReturn {
  const [categorias, setCategorias] = useState<CategoriaEvento[]>(cacheGlobal.categorias)
  const [distritos, setDistritos] = useState<Distrito[]>(cacheGlobal.distritos)
  const [loading, setLoading] = useState(cacheGlobal.loading)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Función para actualizar el estado desde el cache
    const updateState = () => {
      setCategorias(cacheGlobal.categorias)
      setDistritos(cacheGlobal.distritos)
      setLoading(cacheGlobal.loading)
    }
    
    // Suscribirse a cambios en el cache
    cacheGlobal.subscribers.add(updateState)
    
    // Actualizar estado inmediatamente con el estado actual del cache
    updateState()
    
    // Si ya hay una petición en curso, esperar a que termine
    if (cacheGlobal.promise) {
      cacheGlobal.promise
        .then(() => {
          updateState()
        })
        .catch(() => {
          updateState()
        })
    } else if (!cacheGlobal.isReady) {
      // Iniciar carga solo si no hay petición en curso y no está listo
      const cargarDatos = async (): Promise<{ categorias: CategoriaEvento[], distritos: Distrito[] }> => {
        // Actualizar estado de carga ANTES de iniciar la petición
        cacheGlobal.loading = true
        cacheGlobal.isReady = false
        notifySubscribers()
        
        try {
          // Cargar en paralelo - endpoints públicos sin autenticación
          const [categoriasResult, distritosResult] = await Promise.allSettled([
            categoriasEventoService.listar(),
            distritosService.listarPublicos()
          ])
          
          let hasError = false
          const categoriasData: CategoriaEvento[] = []
          const distritosData: Distrito[] = []
          
          // Procesar categorías
          if (categoriasResult.status === 'fulfilled') {
            const response = categoriasResult.value
            if (response.success && response.data) {
              categoriasData.push(...response.data)
            } else {
              console.error('Error: respuesta de categorías sin datos', response)
              hasError = true
            }
          } else {
            console.error('Error cargando categorías:', categoriasResult.reason)
            hasError = true
            // En caso de error, usar array vacío para permitir que la UI se renderice
          }
          
          // Procesar distritos
          if (distritosResult.status === 'fulfilled') {
            const response = distritosResult.value
            if (response.success && response.data) {
              distritosData.push(...response.data)
            } else {
              console.error('Error: respuesta de distritos sin datos', response)
              hasError = true
            }
          } else {
            console.error('Error cargando distritos:', distritosResult.reason)
            hasError = true
            // En caso de error, usar array vacío para permitir que la UI se renderice
          }
          
          // Actualizar cache global de forma atómica
          // isReady debe ser true incluso si hay errores, para que la UI se renderice
          // La UI manejará los casos de datos vacíos o errores
          cacheGlobal.categorias = categoriasData
          cacheGlobal.distritos = distritosData
          cacheGlobal.loading = false
          cacheGlobal.isReady = true // Siempre true después de intentar cargar
          
          // Notificar a todos los subscribers INMEDIATAMENTE después de actualizar el cache
          notifySubscribers()
          
          return { categorias: categoriasData, distritos: distritosData }
        } catch (error) {
          console.error('Error inesperado cargando datos:', error)
          // En caso de error, usar arrays vacíos pero marcar como ready
          // para que la UI se renderice y pueda mostrar el error
          cacheGlobal.categorias = []
          cacheGlobal.distritos = []
          cacheGlobal.loading = false
          cacheGlobal.isReady = true // Marcar como ready incluso con error
          notifySubscribers()
          throw error
        }
      }
      
      // Crear y guardar la promesa
      cacheGlobal.promise = cargarDatos().finally(() => {
        cacheGlobal.promise = null
      })
    }
    
    return () => {
      cacheGlobal.subscribers.delete(updateState)
    }
  }, [])

  // isReady debe ser true solo cuando el cache global está listo y no está cargando
  // El estado local debería estar sincronizado con el cache global
  const isReady = cacheGlobal.isReady && !cacheGlobal.loading

  return {
    categorias,
    distritos,
    loading,
    error,
    isReady
  }
}

