import { useState, useCallback, useMemo, useEffect } from 'react'
import type { TipoEntrada } from '@/lib/types/forms'

interface UseEventoZonasProps {
  localId: string
  localesPorDistrito: any[]
  zonasExistentes?: any[] // Zonas que vienen del backend
  pageMode?: 'create' | 'edit' | 'view'
}

export function useEventoZonas({ localId, localesPorDistrito, zonasExistentes = [], pageMode = 'create' }: UseEventoZonasProps) {
  const [tiposEntrada, setTiposEntrada] = useState<TipoEntrada[]>([])
  const [nuevoTipo, setNuevoTipo] = useState<TipoEntrada>({
    id: "",
    nombre: "",
    descripcion: "",
    precio: 0,
    capacidad: 0,
    zonaAsignada: ""
  })
  const [editandoTipo, setEditandoTipo] = useState<string | null>(null)
  const [tipoEditado, setTipoEditado] = useState<TipoEntrada | null>(null)

  // Cargar zonas existentes cuando estamos en modo view/edit
  useEffect(() => {
    if (pageMode !== 'create' && zonasExistentes && zonasExistentes.length > 0) {
      const zonasConvertidas: TipoEntrada[] = zonasExistentes.map((zona: any) => ({
        id: zona.id?.toString() || '',
        nombre: zona.nombre || '',
        descripcion: zona.descripcion || '',
        precio: parseFloat(zona.precio) || 0,
        capacidad: zona.stock_entradas || 0, // Usar stock_entradas como capacidad
        zonaAsignada: (zona.stock_entradas || 0).toString() // Usar stock_entradas como stock
      }))
      setTiposEntrada(zonasConvertidas)
    }
  }, [zonasExistentes, pageMode])

  // Handler para agregar tipo de entrada
  const handleAgregarTipoEntrada = useCallback(() => {
    if (nuevoTipo.nombre && nuevoTipo.precio > 0 && nuevoTipo.capacidad > 0) {
      setTiposEntrada(prev => [
        ...prev,
        {
          ...nuevoTipo,
          id: `tipo-${Date.now()}`
        }
      ])
      setNuevoTipo({
        id: "",
        nombre: "",
        descripcion: "",
        precio: 0,
        capacidad: 0,
        zonaAsignada: ""
      })
    }
  }, [nuevoTipo])

  // Handler para eliminar tipo de entrada
  const handleEliminarTipoEntrada = useCallback((id: string) => {
    setTiposEntrada(prev => prev.filter(tipo => tipo.id !== id))
  }, [])

  // Handler para iniciar edición
  const handleEditarTipoEntrada = useCallback((tipo: TipoEntrada) => {
    setEditandoTipo(tipo.id)
    setTipoEditado({ ...tipo })
  }, [])

  // Handler para guardar edición
  const handleGuardarEdicionTipo = useCallback(() => {
    if (tipoEditado && editandoTipo) {
      setTiposEntrada(prev => prev.map(tipo => 
        tipo.id === editandoTipo ? tipoEditado : tipo
      ))
      setEditandoTipo(null)
      setTipoEditado(null)
    }
  }, [tipoEditado, editandoTipo])

  // Handler para cancelar edición
  const handleCancelarEdicionTipo = useCallback(() => {
    setEditandoTipo(null)
    setTipoEditado(null)
  }, [])

  // Calcular capacidad disponible (memoizado)
  const calcularCapacidadDisponible = useMemo(() => {
    return (): number => {
      const localSeleccionado = localesPorDistrito.find(l => l.id.toString() === localId)
      if (!localSeleccionado) return 0
      
      const capacidadAsignada = tiposEntrada.reduce((sum, tipo) => sum + tipo.capacidad, 0)
      return localSeleccionado.aforo - capacidadAsignada
    }
  }, [localId, localesPorDistrito, tiposEntrada])

  return {
    // Estados
    tiposEntrada,
    nuevoTipo,
    editandoTipo,
    tipoEditado,
    
    // Setters
    setNuevoTipo,
    setTipoEditado,
    
    // Handlers
    handleAgregarTipoEntrada,
    handleEliminarTipoEntrada,
    handleEditarTipoEntrada,
    handleGuardarEdicionTipo,
    handleCancelarEdicionTipo,
    
    // Cálculos
    calcularCapacidadDisponible
  }
}
