import { useState } from 'react'
import { useCategoriasEvento } from '@/lib/hooks/eventos'
import { useOrganizadores } from '@/lib/hooks/organizadores'

export function useEventoState() {
  // Estados básicos del formulario
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState("")
  const [organizadores, setOrganizadores] = useState("")
  const [fechaEvento, setFechaEvento] = useState<Date | undefined>(undefined)
  const [horaEvento, setHoraEvento] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [esNominal, setEsNominal] = useState(false)
  const [estadoEvento, setEstadoEvento] = useState("Borrador")

  // Hooks de datos externos
  const { categoriasEvento, loading: loadingCategorias, error: errorCategorias } = useCategoriasEvento()
  const { organizadores: listaOrganizadores, loading: loadingOrganizadores, error: errorOrganizadores } = useOrganizadores()

  return {
    // Estados
    nombre,
    descripcion,
    categoria,
    organizadores,
    fechaEvento,
    horaEvento,
    horaFin,
    esNominal,
    estadoEvento,
    
    // Setters
    setNombre,
    setDescripcion,
    setCategoria,
    setOrganizadores,
    setFechaEvento,
    setHoraEvento,
    setHoraFin,
    setEsNominal,
    setEstadoEvento,
    
    // Datos externos
    categoriasEvento,
    listaOrganizadores,
    loadingCategorias,
    loadingOrganizadores,
    errorCategorias,
    errorOrganizadores
  }
}
