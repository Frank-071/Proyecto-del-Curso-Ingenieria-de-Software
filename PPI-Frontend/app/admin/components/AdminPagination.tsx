"use client"

interface PaginationState {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface AdminPaginationProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPrev: () => void
  onNext: () => void
  maxVisiblePages?: number
  showIfSinglePage?: boolean
}

export function AdminPagination({
  pagination,
  onPageChange,
  onPrev,
  onNext,
  maxVisiblePages = 5,
  showIfSinglePage = false,
}: AdminPaginationProps) {
  // Validaciones
  if (!pagination || typeof pagination.totalPages !== 'number' || typeof pagination.currentPage !== 'number') {
    return null
  }

  const { currentPage, totalPages, hasNext, hasPrev } = pagination

  // Validar que totalPages sea válido
  if (totalPages < 0 || !Number.isInteger(totalPages)) {
    return null
  }

  // No mostrar paginación si no hay páginas o solo hay una y showIfSinglePage es false
  if (totalPages === 0 || (totalPages <= 1 && !showIfSinglePage)) {
    return null
  }

  // Validar que currentPage esté en rango válido (después de validar totalPages > 0)
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages))

  // Validar callbacks
  if (!onPageChange || !onPrev || !onNext) {
    return null
  }

  // Validar maxVisiblePages
  const validMaxVisible = Math.max(1, Math.min(maxVisiblePages || 5, totalPages))

  // Calcular qué páginas mostrar (lógica centrada en la página actual)
  const calculateVisiblePages = () => {
    const maxVisible = validMaxVisible

    let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    // Ajustar si no hay suficientes páginas al final
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const visiblePages = calculateVisiblePages()

  // Manejo seguro de eventos
  const handlePageChange = (page: number) => {
    try {
      if (page >= 1 && page <= totalPages && page !== validCurrentPage) {
        onPageChange(page)
      }
    } catch (error) {
      console.error('Error al cambiar de página:', error)
    }
  }

  const handlePrev = () => {
    try {
      if (hasPrev) {
        onPrev()
      }
    } catch (error) {
      console.error('Error al ir a página anterior:', error)
    }
  }

  const handleNext = () => {
    try {
      if (hasNext) {
        onNext()
      }
    } catch (error) {
      console.error('Error al ir a página siguiente:', error)
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="Paginación"
      className="flex items-center justify-center py-4"
    >
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          aria-label="Ir a la página anterior"
          aria-disabled={!hasPrev}
          className="pagination-button px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
        >
          Anterior
        </button>

        <div className="flex items-center space-x-1" role="list">
          {visiblePages.map((pageNum) => {
            const isCurrent = pageNum === validCurrentPage
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                aria-label={`Ir a la página ${pageNum}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`pagination-button w-10 h-10 text-sm font-medium rounded-md cursor-pointer flex items-center justify-center transition-colors duration-150 ${
                  isCurrent ? 'pagination-current' : ''
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={!hasNext}
          aria-label="Ir a la página siguiente"
          aria-disabled={!hasNext}
          className="pagination-button px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
        >
          Siguiente
        </button>
      </div>
    </nav>
  )
}

