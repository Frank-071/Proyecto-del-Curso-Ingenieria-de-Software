import type { CategoriaEventoResponse } from '@/lib/types/entities/categoria-evento'
import type { PeriodoFilter } from './eventos-filters'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
}

export function buildEventosFilterOptions(
  filterCategoria: string,
  setFilterCategoria: (value: string) => void,
  filterEstado: string,
  setFilterEstado: (value: string) => void,
  filterPeriodo: PeriodoFilter,
  setFilterPeriodo: (value: PeriodoFilter) => void,
  categoriasEvento: CategoriaEventoResponse[]
): FilterConfig[] {
  return [
    {
      label: "Categoría",
      placeholder: "Todas las categorías",
      value: filterCategoria,
      onChange: setFilterCategoria,
      options: [
        { value: "todos", label: "Todas las categorías" },
        ...categoriasEvento.map(cat => ({ 
          value: cat.categoria_evento_id.toString(), 
          label: cat.nombre 
        }))
      ]
    },
    {
      label: "Estado", 
      placeholder: "Todos los estados",
      value: filterEstado,
      onChange: setFilterEstado,
      options: [
        { value: "todos", label: "Todos los estados" },
        { value: "Publicado", label: "Publicado" },
        { value: "Proximamente", label: "Próximamente" },
        { value: "Borrador", label: "Borrador" },
        { value: "Cancelado", label: "Cancelado" },
        { value: "Finalizado", label: "Finalizado" }
      ]
    },
    {
      label: "Período",
      placeholder: "Todos los períodos", 
      value: filterPeriodo,
      onChange: (value) => setFilterPeriodo(value as PeriodoFilter),
      options: [
        { value: "todos", label: "Todos los períodos" },
        { value: "proximos_7_dias", label: "Próximos 7 días" },
        { value: "este_mes", label: "Este mes" },
        { value: "proximo_mes", label: "Próximo mes" }
      ]
    }
  ]
}

