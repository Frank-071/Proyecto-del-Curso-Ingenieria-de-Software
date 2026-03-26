import type { UsuarioDisplay } from '@/lib/types/entities/usuario'

// Campos por los que se puede ordenar
export type SortField = 'nombres' | 'apellidos' | 'documento' | 'email' | 'fecha' | 'nombre'
export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  order: SortOrder
}

/**
 * Ordenamiento de usuarios
 * @param usuarios lista original
 * @param config { field, order }
 */
export function sortUsuarios(usuarios: UsuarioDisplay[], config: SortConfig): UsuarioDisplay[] {
  const { field, order } = config

  const sorted = [...usuarios].sort((a, b) => {
    switch (field) {

      case 'nombres':
      case 'nombre': {
        const nombreA = a.nombres ?? ''
        const nombreB = b.nombres ?? ''
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' })
      }

      case 'apellidos': {
        const apellidoA = a.apellidos ?? ''
        const apellidoB = b.apellidos ?? ''
        return apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' })
      }

      case 'documento':
        return (a.numero_documento ?? '').toString().localeCompare((b.numero_documento ?? '').toString())

      case 'email':
        return (a.email ?? '').localeCompare(b.email ?? '', 'es', { sensitivity: 'base' })

      case 'fecha':
        return new Date(a.fecha_creacion || 0).getTime() - new Date(b.fecha_creacion || 0).getTime()

      default:
        return 0
    }
  })

  return order === 'desc' ? sorted.reverse() : sorted
}
