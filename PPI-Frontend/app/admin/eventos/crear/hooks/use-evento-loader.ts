import { useEffect, useState } from 'react'
import { useEventos } from '@/lib/hooks/eventos'
import { localesService } from '@/lib/api/services/locales'
import type { EventoResponse } from '@/lib/types/entities/evento'

interface UseEventoLoaderProps {
  eventoId: number | null
  pageMode: 'create' | 'edit' | 'view'
  // Setters para poblar el formulario
  setNombre: (value: string) => void
  setDescripcion: (value: string) => void
  setCategoria: (value: string) => void
  setOrganizadores: (value: string) => void
  setFechaEvento: (value: Date | undefined) => void
  setHoraEvento: (value: string) => void
  setHoraFin: (value: string) => void
  setEsNominal: (value: boolean) => void
  setEstadoEvento: (value: string) => void
  setLocalId: (value: string) => void
  handleDepartamentoChange: (value: string) => void
  handleProvinciaChange: (value: string) => void
  handleDistritoChange: (value: string) => void
  fetchLocalesPorDistrito: (distritoId: number) => Promise<void>
  setImagenEventoPreview: (value: string | null) => void
  setMapaDistribucionPreview: (value: string | null) => void
}

export function useEventoLoader(props: UseEventoLoaderProps) {
  const { obtenerEventoPorId, loading } = useEventos()
  const [eventoData, setEventoData] = useState<EventoResponse | null>(null)
  const [loadingEvento, setLoadingEvento] = useState(false)

  useEffect(() => {
    // Solo cargar si estamos en modo editar o visualizar y tenemos un ID
    if ((props.pageMode === 'edit' || props.pageMode === 'view') && props.eventoId) {
      cargarEvento()
    }
  }, [props.eventoId, props.pageMode])

  const cargarEvento = async () => {
    if (!props.eventoId) return

    setLoadingEvento(true)
    try {
      const result = await obtenerEventoPorId(props.eventoId)

      if (result.success && 'data' in result && result.data) {
        const evento = result.data
        setEventoData(evento)

        // Poblar el formulario con los datos del evento
        props.setNombre(evento.nombre || '')
        props.setDescripcion(evento.descripcion || '')

        // Los IDs vienen como números, convertir a strings para los dropdowns
        props.setCategoria(evento.categoria_evento_id?.toString() || '')
        props.setOrganizadores(evento.organizador_id?.toString() || '')
        props.setEsNominal(evento.es_nominal || false)
        props.setEstadoEvento(evento.estado || 'Borrador')

        // Fechas y horas
        if (evento.fecha_hora_inicio) {
          const fechaInicio = new Date(evento.fecha_hora_inicio)
          props.setFechaEvento(fechaInicio)
          props.setHoraEvento(fechaInicio.toTimeString().slice(0, 5)) // HH:MM
        }

        if (evento.fecha_hora_fin) {
          const fechaFin = new Date(evento.fecha_hora_fin)
          props.setHoraFin(fechaFin.toTimeString().slice(0, 5)) // HH:MM
        }

        // Ubicación
        let originalLocalId = null
        if (evento.local_id) {
          originalLocalId = evento.local_id.toString()
          props.setLocalId(originalLocalId)
        }

        // Si viene información expandida del local, poblar departamento, provincia, distrito
        if (evento.local?.distrito?.provincia?.departamento?.id) {
          props.handleDepartamentoChange(evento.local.distrito.provincia.departamento.id.toString())
          // Esperar un poco para que se carguen las provincias
          setTimeout(() => {
            if (evento.local?.distrito?.provincia?.id) {
              props.handleProvinciaChange(evento.local.distrito.provincia.id.toString())
              // Esperar un poco para que se carguen los distritos
              setTimeout(() => {
                if (evento.local?.distrito?.id) {
                  props.handleDistritoChange(evento.local.distrito.id.toString())
                  // Cargar los locales del distrito para que se pueda mostrar el local seleccionado
                  setTimeout(() => {
                    props.fetchLocalesPorDistrito(evento.local.distrito.id)
                    // Restaurar el localId original después de cargar los locales
                    setTimeout(() => {
                      if (originalLocalId) {
                        props.setLocalId(originalLocalId)
                      }
                    }, 300)
                  }, 200)
                }
              }, 100)
            }
          }, 100)
        }

        // Imágenes - usar las URLs del backend como preview
        if (evento.icono) {
          props.setImagenEventoPreview(evento.icono)
        }

        if (evento.mapa) {
          props.setMapaDistribucionPreview(evento.mapa)
        }
      }
    } catch (error) {
      console.error('Error cargando evento:', error)
    } finally {
      setLoadingEvento(false)
    }
  }

  return {
    eventoData,
    loadingEvento,
    refetchEvento: cargarEvento
  }
}
