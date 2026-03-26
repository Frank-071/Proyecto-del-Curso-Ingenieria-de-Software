import { useState, useCallback } from 'react'
import { useDepartamentos } from '@/lib/hooks/geografia'
import { useProvincias } from '@/lib/hooks/geografia'
import { useDistritos } from '@/lib/hooks/geografia'
import { useLocalesPorDistrito } from '@/lib/hooks/locales'

export function useEventoUbicacion() {
  // Estados de ubicación
  const [departamento, setDepartamento] = useState("")
  const [provincia, setProvincia] = useState("")
  const [distrito, setDistrito] = useState("")
  const [localId, setLocalId] = useState("")

  // Hooks de datos geográficos
  const { departamentos, loading: loadingDepartamentos } = useDepartamentos()
  const { provincias, fetchProvinciasPorDepartamento } = useProvincias()
  const { distritos, fetchDistritosPorProvincia } = useDistritos()
  const { locales: localesPorDistrito, loading: loadingLocales, fetchLocalesPorDistrito, clearLocales } = useLocalesPorDistrito()

  // Handler para cambio de departamento (con cascada)
  const handleDepartamentoChange = useCallback((value: string) => {
    setDepartamento(value)
    setProvincia("")
    setDistrito("")
    setLocalId("")
    clearLocales()
    
    if (value) {
      fetchProvinciasPorDepartamento(parseInt(value))
    }
  }, [fetchProvinciasPorDepartamento, clearLocales])

  // Handler para cambio de provincia (con cascada)
  const handleProvinciaChange = useCallback((value: string) => {
    setProvincia(value)
    setDistrito("")
    setLocalId("")
    clearLocales()
    
    if (value) {
      fetchDistritosPorProvincia(parseInt(value))
    }
  }, [fetchDistritosPorProvincia, clearLocales])

  // Handler para cambio de distrito
  const handleDistritoChange = useCallback((value: string) => {
    setDistrito(value)
    setLocalId("")
    
    if (value) {
      fetchLocalesPorDistrito(parseInt(value))
    } else {
      clearLocales()
    }
  }, [fetchLocalesPorDistrito, clearLocales])

  return {
    // Estados
    departamento,
    provincia,
    distrito,
    localId,
    
    // Setters
    setLocalId,
    
    // Datos
    departamentos,
    provincias,
    distritos,
    localesPorDistrito,
    loadingDepartamentos,
    loadingLocales,
    
    // Handlers
    handleDepartamentoChange,
    handleProvinciaChange,
    handleDistritoChange,
    fetchLocalesPorDistrito
  }
}
