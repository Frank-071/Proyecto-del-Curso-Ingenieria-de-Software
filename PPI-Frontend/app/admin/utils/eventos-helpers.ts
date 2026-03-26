import type { CategoriaEventoResponse } from '@/lib/types/entities/categoria-evento'

export function getCategoriaNombre(
  categoriaId: number,
  categoriasEvento: CategoriaEventoResponse[]
): string {
  const categoria = categoriasEvento.find(c => c.categoria_evento_id === categoriaId)
  return categoria ? categoria.nombre : `Categoría ${categoriaId}`
}

