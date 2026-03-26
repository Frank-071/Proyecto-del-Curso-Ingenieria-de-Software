import type { LocalDisplay } from '@/lib/types/entities/local'

// Tipos para ordenamiento
export type SortField = 'nombre' | 'capacidad' | 'fecha'
export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  order: SortOrder
}

// Función pura de ordenamiento
export function sortLocales(locales: LocalDisplay[], config: SortConfig): LocalDisplay[] {
  const { field, order } = config
  const sorted = [...locales].sort((a, b) => {
    switch (field) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre)
      case 'capacidad':
        return a.capacidad - b.capacidad
      case 'fecha':
        return new Date(a.fechaRegistro || 0).getTime() - new Date(b.fechaRegistro || 0).getTime()
      default:
        return 0
    }
  })
  
  return order === 'desc' ? sorted.reverse() : sorted
}

