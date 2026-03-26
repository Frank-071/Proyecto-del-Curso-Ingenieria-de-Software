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

/**
 * Filtros disponibles para Usuarios:
 * - Estado (Activo / Inactivo / Todos)
 * - Búsqueda (input)
 */
export function buildUsuariosFilterOptions(
  filterEstado: string,
  setFilterEstado: (value: string) => void,
  searchTerm: string,
  setSearchTerm: (value: string) => void,
): FilterConfig[] {
  const estadoOptions: FilterOption[] = [
    { value: "todos", label: "Todos" },
    { value: "Activo", label: "Activo" },
    { value: "Inactivo", label: "Inactivo" }
  ]

  return [
    {
      label: "Estado",
      placeholder: "Estado",
      value: filterEstado,
      onChange: setFilterEstado,
      options: estadoOptions
    }
  ]
}

