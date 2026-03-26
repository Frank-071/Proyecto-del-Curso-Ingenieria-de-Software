import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { PageMode } from '@/lib/types/forms'
import { useEventoState } from './use-evento-state'
import { useEventoUbicacion } from './use-evento-ubicacion'
import { useEventoImagenes } from './use-evento-imagenes'
import { useEventoZonas } from './use-evento-zonas'
import { useEventoSubmit } from './use-evento-submit'
import { useEventoLoader } from './use-evento-loader'

/**
 * Hook orquestador principal para el formulario de eventos
 * Combina todos los hooks especializados y coordina el flujo general
 */
export function useEventoForm() {
  // Estado de modo de página y ID del evento
  const [pageMode, setPageMode] = useState<PageMode>('create')
  const [eventoId, setEventoId] = useState<number | null>(null)
  
  // Hook para obtener parámetros de URL
  const searchParams = useSearchParams()

  // Hook 1: Estados básicos del formulario
  const estadoBasico = useEventoState()

  // Hook 2: Ubicación geográfica
  const ubicacion = useEventoUbicacion()

  // Hook 3: Manejo de imágenes
  const imagenes = useEventoImagenes()

  // Hook 6: Cargar datos del evento (para modo editar/visualizar)
  const loader = useEventoLoader({
    eventoId,
    pageMode,
    setNombre: estadoBasico.setNombre,
    setDescripcion: estadoBasico.setDescripcion,
    setCategoria: estadoBasico.setCategoria,
    setOrganizadores: estadoBasico.setOrganizadores,
    setFechaEvento: estadoBasico.setFechaEvento,
    setHoraEvento: estadoBasico.setHoraEvento,
    setHoraFin: estadoBasico.setHoraFin,
    setEsNominal: estadoBasico.setEsNominal,
    setEstadoEvento: estadoBasico.setEstadoEvento,
    setLocalId: ubicacion.setLocalId,
    handleDepartamentoChange: ubicacion.handleDepartamentoChange,
    handleProvinciaChange: ubicacion.handleProvinciaChange,
    handleDistritoChange: ubicacion.handleDistritoChange,
    fetchLocalesPorDistrito: ubicacion.fetchLocalesPorDistrito,
    setImagenEventoPreview: imagenes.setImagenEventoPreview,
    setMapaDistribucionPreview: imagenes.setMapaDistribucionPreview,
  })

  // Hook 4: Gestión de zonas (depende de ubicación y loader)
  const zonas = useEventoZonas({
    localId: ubicacion.localId,
    localesPorDistrito: ubicacion.localesPorDistrito,
    zonasExistentes: loader.eventoData?.zonas || [],
    pageMode
  })

  // Hook 5: Lógica de guardado (depende de todos los anteriores)
  const submit = useEventoSubmit({
    nombre: estadoBasico.nombre,
    descripcion: estadoBasico.descripcion,
    categoria: estadoBasico.categoria,
    organizadores: estadoBasico.organizadores,
    fechaEvento: estadoBasico.fechaEvento,
    horaEvento: estadoBasico.horaEvento,
    horaFin: estadoBasico.horaFin,
    esNominal: estadoBasico.esNominal,
    estadoEvento: estadoBasico.estadoEvento,
    localId: ubicacion.localId,
    tiposEntrada: zonas.tiposEntrada,
    imagenEventoFile: imagenes.imagenEventoFile,
    mapaDistribucionFile: imagenes.mapaDistribucionFile,
    pageMode,
    eventoId
  })

  // Verificar modo de página (crear/editar/visualizar)
  useEffect(() => {
    const editId = searchParams.get('edit')
    const viewId = searchParams.get('view')
    
    if (editId) {
      setPageMode('edit')
      setEventoId(parseInt(editId))
    } else if (viewId) {
      setPageMode('view')
      setEventoId(parseInt(viewId))
    }
  }, [searchParams])

  // Retornar interfaz unificada
  return {
    // Estados de página
    pageMode,
    eventoId,
    
    // Estados básicos
    ...estadoBasico,
    
    // Estados de ubicación
    ...ubicacion,
    
    // Estados de imágenes
    ...imagenes,
    
    // Estados de zonas
    ...zonas,
    
    // Estados y handlers de submit
    ...submit,
    
    // Estados del loader
    ...loader
  }
}
