import type { Evento } from '@/lib/types/evento'

// Tipos para ordenamiento
export type SortField = 'nombre' | 'fecha' | 'ventas' | 'categoria'
export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  order: SortOrder
}

// Tipos para filtro de período (coinciden con backend)
export type PeriodoFilter = 
  | 'todos' 
  | 'proximos_7_dias' 
  | 'este_mes' 
  | 'proximo_mes'

// Función pura de ordenamiento
export function sortEventos(eventos: Evento[], config: SortConfig): Evento[] {
  const { field, order } = config
  const sorted = [...eventos].sort((a, b) => {
    switch (field) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre)
      case 'fecha':
        return new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime()
      case 'ventas': {
        // TODO: Actualizar cuando el backend agregue campo de ventas (ej: tickets_vendidos)
        // Por ahora retorna 0 (todos iguales)
        const ventasA = (a as any).tickets_vendidos || 0
        const ventasB = (b as any).tickets_vendidos || 0
        return ventasA - ventasB
      }
      case 'categoria':
        return a.categoria_evento_id - b.categoria_evento_id
      default:
        return 0
    }
  })
  
  return order === 'desc' ? sorted.reverse() : sorted
}

// Nota: El filtrado por período ahora se hace server-side
// Esta función ya no se usa, se mantiene por compatibilidad

