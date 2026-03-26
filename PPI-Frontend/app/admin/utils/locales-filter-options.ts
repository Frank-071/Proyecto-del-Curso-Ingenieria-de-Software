import type { TipoLocalResponse } from '@/lib/types/entities/tipo-local'
import type { DistritoResponse } from '@/lib/types/entities/geografia'

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

export function buildLocalesFilterOptions(
  filterTipo: string,
  setFilterTipo: (value: string) => void,
  filterEstado: string,
  setFilterEstado: (value: string) => void,
  filterDistrito: string,
  setFilterDistrito: (value: string) => void,
  tiposLocales: TipoLocalResponse[] | undefined,
  distritos: DistritoResponse[]
): FilterConfig[] {
  return [
    {
      label: "Tipo de local",
      placeholder: "Tipo de local",
      value: filterTipo,
      onChange: setFilterTipo,
      options: [
        { value: "todos", label: "Todos los tipos" },
        ...(tiposLocales?.map(tipo => ({ value: tipo.id.toString(), label: tipo.nombre })) || [])
      ]
    },
    {
      label: "Estado",
      placeholder: "Estado",
      value: filterEstado,
      onChange: setFilterEstado,
      options: [
        { value: "todos", label: "Todos los estados" },
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" }
      ]
    },
    {
      label: "Distrito",
      placeholder: "Todos los distritos",
      value: filterDistrito,
      onChange: setFilterDistrito,
      options: [
        { value: "todos", label: "Todos los distritos" },
        ...distritos.map(distrito => ({
          value: distrito.distrito_id.toString(),
          label: distrito.nombre
        }))
      ]
    }
  ]
}

