// Tipo que viene del backend (con 'id')
export interface CategoriaEventoBackend {
  id: number
  nombre: string
  descripcion?: string
}

// Tipo normalizado para uso interno del frontend (con 'categoria_evento_id')
export interface CategoriaEvento {
  categoria_evento_id: number
  nombre: string
  descripcion?: string
}

// Alias para compatibilidad
export interface CategoriaEventoResponse extends CategoriaEvento {}

// Función helper para normalizar categoría del backend
export function normalizarCategoriaEvento(categoria: CategoriaEventoBackend): CategoriaEvento {
  return {
    categoria_evento_id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion
  }
}