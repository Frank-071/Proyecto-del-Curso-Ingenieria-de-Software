import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useEventos } from '@/lib/hooks/eventos'
import { useZonas } from '@/lib/hooks/eventos'
import { tokenUtils } from '@/lib/auth/token'
import type { TipoEntrada } from '@/lib/types/forms'

interface UseEventoSubmitProps {
  nombre: string
  descripcion: string
  categoria: string
  organizadores: string
  fechaEvento: Date | undefined
  horaEvento: string
  horaFin: string
  esNominal: boolean
  estadoEvento: string
  localId: string
  tiposEntrada: TipoEntrada[]
  imagenEventoFile: File | null
  mapaDistribucionFile: File | null
  pageMode?: 'create' | 'edit' | 'view'
  eventoId?: number | null
}

export function useEventoSubmit(props: UseEventoSubmitProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { crearEvento, actualizarEvento, loading: loadingEvento, error: errorEvento } = useEventos()
  const { crearMultiplesZonas, actualizarZona, eliminarZona, eliminarZonasDelEvento, loading: loadingZonas } = useZonas()

  // Función para manejar zonas según el modo (crear/editar)
  const manejarZonas = useCallback(async (eventoId: number, zonasExistentes: any[] = []) => {
    // Solo crear las zonas NUEVAS (las que no tienen id)
    const zonasNuevas = props.tiposEntrada.filter(tipo => !tipo.id || tipo.id === '')

    if (zonasNuevas.length === 0) {
      return { success: true, resultados: [] }
    }

    // Crear solo las zonas nuevas
    const zonasParaCrear = zonasNuevas.map(tipo => ({
      evento_id: eventoId,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      precio: tipo.precio,
      capacidad: tipo.capacidad,
      stock_entradas: tipo.capacidad,
      entradas_disponible: tipo.capacidad
    }))

    const resultado = await crearMultiplesZonas(zonasParaCrear)
    return resultado
  }, [props.tiposEntrada, props.pageMode, crearMultiplesZonas])

  const handleGuardar = useCallback(async () => {
    setIsLoading(true)

    try {
      const adminId = await tokenUtils.getUserId()
      if (!adminId) {
        toast.error('Sesión expirada', {
          description: 'Por favor, inicie sesión nuevamente.'
        })
        setIsLoading(false)
        return
      }

      // Validaciones
      if (!props.localId || props.localId === "") {
        toast.error('Campos incompletos', {
          description: 'Debe seleccionar un local válido'
        })
        setIsLoading(false)
        return
      }

      if (!props.organizadores || props.organizadores === "") {
        toast.error('Campos incompletos', {
          description: 'Debe seleccionar un organizador válido'
        })
        setIsLoading(false)
        return
      }

      if (!props.categoria || props.categoria === "") {
        toast.error('Campos incompletos', {
          description: 'Debe seleccionar una categoría válida'
        })
        setIsLoading(false)
        return
      }

      if (props.tiposEntrada.length === 0) {
        toast.error('Campos incompletos', {
          description: 'Debe agregar al menos una zona para el evento'
        })
        setIsLoading(false)
        return
      }

      // Crear FormData
      const formData = new FormData()

      formData.append('local_id', props.localId)
      formData.append('organizador_id', props.organizadores)
      formData.append('categoria_evento_id', props.categoria)
      formData.append('administrador_id', adminId)
      formData.append('nombre', props.nombre)
      formData.append('descripcion', props.descripcion)
      formData.append('es_nominal', props.esNominal.toString())
      formData.append('estado', props.estadoEvento)

      const fechaInicio = `${props.fechaEvento?.toISOString().split('T')[0]}T${props.horaEvento}:00`
      const fechaFin = `${props.fechaEvento?.toISOString().split('T')[0]}T${props.horaFin}:00`

      formData.append('fecha_hora_inicio', fechaInicio)
      formData.append('fecha_hora_fin', fechaFin)

      // Agregar zonas como JSON (tanto en creación como en edición)
      const zonasParaEnviar = props.tiposEntrada.map(tipo => ({
        // Incluir el ID solo si existe y es un ID válido de BD (no temporal como 'tipo-123')
        ...(tipo.id && !tipo.id.startsWith('tipo-') ? { id: parseInt(tipo.id) } : {}),
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        precio: parseFloat(tipo.precio.toString()),
        stock_entradas: parseInt(tipo.capacidad.toString()),
        entradas_disponible: parseInt(tipo.capacidad.toString())
      }))
      formData.append('zonas', JSON.stringify(zonasParaEnviar))

      // Agregar imágenes directamente como archivos File
      if (props.imagenEventoFile) {
        formData.append('icono', props.imagenEventoFile, props.imagenEventoFile.name)
      }

      if (props.mapaDistribucionFile) {
        formData.append('mapa', props.mapaDistribucionFile, props.mapaDistribucionFile.name)
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      // Usar el método correcto según el modo
      const resultado = props.pageMode === 'edit' && props.eventoId
        ? await actualizarEvento(props.eventoId, formData)
        : await crearEvento(formData)

      if (resultado.success) {
        const respuestaCompleta = resultado as any
        const warnings = respuestaCompleta.warnings

        // En modo edición, aún necesitamos crear las zonas nuevas por separado
        if (props.pageMode === 'edit') {
          const eventoId = props.eventoId || respuestaCompleta.evento_id || respuestaCompleta.data?.id

          if (eventoId) {
            const resultadoZonas = await manejarZonas(eventoId)

            if (resultadoZonas.success) {
              if (warnings && warnings.length > 0) {
                toast.success('Evento actualizado con advertencias', {
                  description: `Evento y zonas actualizados exitosamente. Advertencias: ${warnings.join(', ')}`
                })
              } else {
                toast.success('Evento actualizado exitosamente', {
                  description: 'El evento y sus zonas se han actualizado correctamente'
                })
              }
            } else {
              toast.warning('Evento actualizado parcialmente', {
                description: `Evento actualizado pero hubo un error al crear las zonas nuevas: ${resultadoZonas.detail}`
              })
            }
          }
        } else {
          // En modo creación, las zonas ya fueron creadas con el evento
          if (warnings && warnings.length > 0) {
            toast.success('Evento creado con advertencias', {
              description: `Evento y zonas creados exitosamente. Advertencias: ${warnings.join(', ')}`
            })
          } else {
            toast.success('Evento creado exitosamente', {
              description: 'El evento y sus zonas se han creado correctamente'
            })
          }
        }

        router.push("/admin/eventos")
      } else {
        toast.error(props.pageMode === 'edit' ? 'Error al actualizar el evento' : 'Error al crear el evento', {
          description: resultado.detail || 'Ocurrió un error inesperado'
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error inesperado', {
        description: `No se pudo ${props.pageMode === 'edit' ? 'actualizar' : 'crear'} el evento. Por favor, inténtelo nuevamente.`
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    props.localId,
    props.organizadores,
    props.categoria,
    props.tiposEntrada,
    props.nombre,
    props.descripcion,
    props.esNominal,
    props.estadoEvento,
    props.fechaEvento,
    props.horaEvento,
    props.horaFin,
    props.imagenEventoFile,
    props.mapaDistribucionFile,
    props.pageMode,
    props.eventoId,
    crearEvento,
    actualizarEvento,
    manejarZonas,
    router
  ])

  return {
    isLoading,
    loadingEvento,
    loadingZonas,
    errorEvento,
    handleGuardar,
    router
  }
}
