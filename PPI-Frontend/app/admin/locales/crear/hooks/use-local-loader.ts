"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LocalFormDependencies, LocalPageMode } from '@/lib/types/forms'
import { useLocales } from '@/lib/hooks/locales'
import { departamentosService } from '@/lib/api/services/geografia'
import { provinciasService } from '@/lib/api/services/geografia'
import { distritosService } from '@/lib/api/services/geografia'
import { tiposLocalesService } from '@/lib/api/services/locales'
import { toast } from 'sonner'

export function useLocalLoader() {
  const [isLoading, setIsLoading] = useState(true)
  const [pageMode, setPageMode] = useState<LocalPageMode>('create')
  const [localId, setLocalId] = useState<number | null>(null)
  const [dependencies, setDependencies] = useState<LocalFormDependencies>({
    departamentos: [],
    provincias: [],
    distritos: [],
    tiposLocales: [],
    todasLasProvincias: [],
    todosLosDistritos: []
  })

  const router = useRouter()
  const { fetchLocalById } = useLocales()
  const isInitialized = useRef(false)
  const dependenciesLoaded = useRef(false)

  // Función para cargar dependencias (sin useCallback para evitar loops)
  const cargarDependencias = async (): Promise<Pick<LocalFormDependencies, 'departamentos' | 'provincias' | 'distritos' | 'tiposLocales'>> => {
    try {
      const [departamentosData, provinciasData, distritosData, tiposData] = await Promise.all([
        departamentosService.listar(),
        provinciasService.listar(),
        distritosService.listar(),
        tiposLocalesService.listar()
      ])
      
      const departamentosArray = Array.isArray(departamentosData) ? departamentosData : departamentosData?.data || []
      const provinciasArray = Array.isArray(provinciasData) ? provinciasData : provinciasData?.data || []
      const distritosArray = Array.isArray(distritosData) ? distritosData : distritosData?.data || []
      const tiposArray = Array.isArray(tiposData) ? tiposData : tiposData?.data || []
      
      setDependencies(prev => ({
        ...prev,
        departamentos: departamentosArray,
        provincias: provinciasArray, // Mantener todas las provincias disponibles
        distritos: distritosArray, // Mantener todos los distritos disponibles
        tiposLocales: tiposArray,
        todasLasProvincias: provinciasArray,
        todosLosDistritos: distritosArray
      }))
      
      dependenciesLoaded.current = true
      
      return {
        departamentos: departamentosArray,
        provincias: provinciasArray,
        distritos: distritosArray,
        tiposLocales: tiposArray
      }
    } catch (error) {
      toast.error('Error cargando dependencias', {
        description: 'No se pudieron cargar los datos necesarios'
      })
      return {
        departamentos: [],
        provincias: [],
        distritos: [],
        tiposLocales: []
      }
    }
  }

  // Función para cargar datos del local (optimizada)
  const loadLocalData = async (id: number) => {
    setIsLoading(true)
    try {
      // Solo cargar dependencias si no están cargadas
      let dependenciasData
      if (!dependenciesLoaded.current) {
        dependenciasData = await cargarDependencias()
      } else {
        // Usar dependencias del estado actual
        dependenciasData = {
          departamentos: dependencies.departamentos,
          provincias: dependencies.todasLasProvincias,
          distritos: dependencies.todosLosDistritos,
          tiposLocales: dependencies.tiposLocales
        }
      }

      const result = await fetchLocalById(id)
      
      if (result && result.success && result.data) {
        const localData = result.data
        
        // Encontrar ubicación usando los datos cargados
        const distrito = dependenciasData.distritos.find((d) => d.distrito_id === localData.distrito_id)
        const provincia = distrito ? dependenciasData.provincias.find((p) => p.id === distrito.provincia_id) : null
        const departamento = provincia ? dependenciasData.departamentos.find((d) => d.id === provincia.departamento_id) : null

        return {
          localData,
          departamento,
          provincia,
          distrito
        }
      } else {
        toast.error('Local no encontrado', {
          description: `El local con ID ${id} no existe en la base de datos`
        })
        router.push('/admin/locales')
        return null
      }
    } catch (error) {
      toast.error('Error cargando local', {
        description: `No se pudo cargar el local con ID ${id}`
      })
      router.push('/admin/locales')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Un solo useEffect para inicialización (sin dependencias problemáticas)
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializePage = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const editId = searchParams.get('edit')
      const viewId = searchParams.get('view')
      
      if (editId) {
        setPageMode('edit')
        setLocalId(Number(editId))
        await loadLocalData(Number(editId))
      } else if (viewId) {
        setPageMode('view')
        setLocalId(Number(viewId))
        await loadLocalData(Number(viewId))
      } else {
        // Modo create
        await cargarDependencias()
        setIsLoading(false)
      }
    }
    
    initializePage()
  }, []) // Sin dependencias para evitar loops

  return {
    isLoading,
    setIsLoading,
    pageMode,
    setPageMode,
    localId,
    setLocalId,
    dependencies,
    setDependencies,
    cargarDependencias,
    loadLocalData
  }
}