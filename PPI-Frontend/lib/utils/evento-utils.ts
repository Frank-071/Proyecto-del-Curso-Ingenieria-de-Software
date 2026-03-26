import { EventoResponse, EventoPublicResponse } from '@/lib/types/entities/evento'
import { LocalResponse } from '@/lib/types/entities/local'

const fechaCache = new Map<string, string>()
const categoriaCache = new Map<number, string>()

export function formatearFecha(fechaISO: string): string {
  if (fechaCache.has(fechaISO)) {
    return fechaCache.get(fechaISO)!
  }

  const fecha = new Date(fechaISO)
  const ahora = new Date()
  const mañana = new Date(ahora)
  mañana.setDate(ahora.getDate() + 1)

  let resultado: string

  // Verificar si es hoy
  if (fecha.toDateString() === ahora.toDateString()) {
    resultado = `Hoy, ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
  }
  // Verificar si es mañana
  else if (fecha.toDateString() === mañana.toDateString()) {
    resultado = `Mañana, ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
  }
  // Verificar si es esta semana
  else {
    const diasDiferencia = Math.ceil((fecha.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
    if (diasDiferencia <= 7 && diasDiferencia > 1) {
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      resultado = `${diasSemana[fecha.getDay()]}, ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      // Fecha normal
      resultado = fecha.toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        year: fecha.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  fechaCache.set(fechaISO, resultado)
  return resultado
}

/**
 * Formatea el precio más bajo de las zonas del evento
 */
export function formatearPrecio(evento: EventoResponse): string {
  if (!evento.zonas || evento.zonas.length === 0) {
    return 'Precio por consultar'
  }

  const precios = evento.zonas.map(zona => zona.precio).filter(precio => precio > 0)
  
  if (precios.length === 0) {
    return 'Entrada libre'
  }

  const precioMinimo = Math.min(...precios)
  const precioMaximo = Math.max(...precios)

  if (precioMinimo === precioMaximo) {
    return `S/${precioMinimo.toFixed(2)}`
  }

  return `Desde S/${precioMinimo.toFixed(2)}`
}

/**
 * Obtiene la ubicación completa del evento
 */
export function obtenerUbicacion(evento: EventoResponse): string {
  if (evento.local?.nombre) {
    return evento.local.nombre
  }
  
  return 'Local por confirmar'
}

/**
 * Obtiene la ubicación del evento usando información del local
 */
export function obtenerUbicacionConLocal(evento: EventoResponse, local?: LocalResponse): string {
  if (local?.nombre) {
    return local.nombre
  }
  
  if (evento.local?.nombre) {
    return evento.local.nombre
  }
  
  return 'Local por confirmar'
}

/**
 * Obtiene el nombre del local del evento
 */
export function obtenerNombreLocal(evento: EventoResponse, local?: LocalResponse): string {
  if (local) {
    return local.nombre
  }
  if (evento.local?.nombre) {
    return evento.local.nombre
  }
  return 'Local por confirmar'
}

/**
 * Obtiene la categoría del evento
 */
export function obtenerCategoria(evento: EventoResponse): string {
  if (categoriaCache.has(evento.categoria_evento_id)) {
    return categoriaCache.get(evento.categoria_evento_id)!
  }

  let categoria: string
  if (evento.categoria_evento?.nombre) {
    categoria = evento.categoria_evento.nombre
  } else {
    categoria = 'Evento'
  }

  categoriaCache.set(evento.categoria_evento_id, categoria)
  return categoria
}

/**
 * Obtiene el nombre del organizador del evento
 */
export function obtenerOrganizador(evento: EventoResponse): string {
  if (evento.organizador?.nombre) {
    return evento.organizador.nombre
  }
  return 'Organizador por confirmar'
}

/**
 * Obtiene la URL de la imagen del evento o un placeholder
 */
export function obtenerImagenEvento(evento: EventoResponse): string {
  if (evento.icono_url) {
    return evento.icono_url
  }
  
  if ((evento as any).icono) {
    return (evento as any).icono
  }
  
  return '/placeholder.svg'
}

/**
 * Obtiene el estado del evento en español
 */
export function obtenerEstadoEvento(estado: string): string {
  const estadosMap: Record<string, string> = {
    'activo': 'Activo',
    'inactivo': 'Inactivo',
    'cancelado': 'Cancelado',
    'finalizado': 'Finalizado',
    'proximamente': 'Próximamente'
  }
  return estadosMap[estado.toLowerCase()] || estado
}

/**
 * Determina si un evento está próximo (en las próximas 24 horas)
 */
export function esEventoProximo(fechaInicio: string): boolean {
  const fecha = new Date(fechaInicio)
  const ahora = new Date()
  const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
  
  return fecha >= ahora && fecha <= en24Horas
}

/**
 * Determina si un evento es trending (basado en disponibilidad)
 */
export function esEventoTrending(evento: EventoResponse): boolean {
  if (!evento.zonas || evento.zonas.length === 0) {
    return evento.evento_id % 3 === 0
  }
  
  const totalCapacidad = evento.zonas.reduce((sum, zona) => sum + zona.capacidad, 0)
  const totalDisponibles = evento.zonas.reduce((sum, zona) => sum + zona.entradas_disponible, 0)
  
  const porcentajeDisponible = totalDisponibles / totalCapacidad
  return porcentajeDisponible < 0.3
}


/**
 * Obtiene la ubicación del evento público
 */
export function obtenerUbicacionPublica(evento: EventoPublicResponse): string {
  return evento.local_nombre
}

/**
 * Obtiene la URL de la imagen del evento público
 */
export function obtenerImagenEventoPublico(evento: EventoPublicResponse): string {
  if (evento.icono_url) {
    return evento.icono_url
  }
  return '/placeholder.svg'
}

/**
 * Obtiene la categoría del evento público
 */
export function obtenerCategoriaPublica(evento: EventoPublicResponse): string {
  return evento.categoria_nombre || 'Evento'
}

/**
 * Determina si un evento público está próximo
 */
export function esEventoProximoPublico(fechaInicio: string): boolean {
  const fecha = new Date(fechaInicio)
  const ahora = new Date()
  const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
  
  return fecha >= ahora && fecha <= en24Horas
}

/**
 * Determina si un evento público es trending
 */
export function esEventoTrendingPublico(evento: EventoPublicResponse): boolean {
  return evento.evento_id % 3 === 0
}

/**
 * Función para limpiar cache si es necesario
 */
export function limpiarCache(): void {
  fechaCache.clear()
  categoriaCache.clear()
}