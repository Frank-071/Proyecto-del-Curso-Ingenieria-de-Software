"use client"

import { useState, useCallback, useMemo } from 'react'
import { LocalFormDependencies } from '@/lib/types/forms'

export function useLocalUbicacion(dependencies: LocalFormDependencies) {
  const [provincias, setProvincias] = useState<LocalFormDependencies['provincias']>([])
  const [distritos, setDistritos] = useState<LocalFormDependencies['distritos']>([])

  // Memoizar las dependencias para evitar re-renders innecesarios
  const todasLasProvincias = useMemo(() => dependencies.todasLasProvincias, [dependencies.todasLasProvincias])
  const todosLosDistritos = useMemo(() => dependencies.todosLosDistritos, [dependencies.todosLosDistritos])

  const handleDepartamentoChange = useCallback((departamentoId: string, onFormChange: (name: string, value: string) => void) => {
    if (departamentoId) {
      const provinciasFiltradas = todasLasProvincias.filter(p => p.departamento_id === parseInt(departamentoId))
      setProvincias(provinciasFiltradas)
      setDistritos([])
      
      onFormChange("provincia", "")
      onFormChange("distrito", "")
    } else {
      setProvincias([])
      setDistritos([])
    }
  }, [todasLasProvincias])

  const handleProvinciaChange = useCallback((provinciaId: string, onFormChange: (name: string, value: string) => void) => {
    if (provinciaId) {
      const distritosFiltrados = todosLosDistritos.filter(d => d.provincia_id === parseInt(provinciaId))
      setDistritos(distritosFiltrados)
      
      onFormChange("distrito", "")
    } else {
      setDistritos([])
    }
  }, [todosLosDistritos])

  const setProvinciasFromDepartamento = useCallback((departamentoId: number) => {
    const provinciasFiltradas = todasLasProvincias.filter(p => p.departamento_id === departamentoId)
    setProvincias(provinciasFiltradas)
  }, [todasLasProvincias])

  const setDistritosFromProvincia = useCallback((provinciaId: number) => {
    const distritosFiltrados = todosLosDistritos.filter(d => d.provincia_id === provinciaId)
    setDistritos(distritosFiltrados)
  }, [todosLosDistritos])

  const resetUbicacion = useCallback(() => {
    setProvincias([])
    setDistritos([])
  }, [])

  return {
    provincias,
    distritos,
    handleDepartamentoChange,
    handleProvinciaChange,
    setProvinciasFromDepartamento,
    setDistritosFromProvincia,
    resetUbicacion
  }
}
