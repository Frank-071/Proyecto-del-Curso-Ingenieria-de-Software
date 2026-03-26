"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useEventosPublicos } from "@/lib/stores/eventos-store"
import {
  formatearFecha,
  obtenerUbicacionPublica,
  obtenerImagenEventoPublico,
  obtenerCategoriaPublica,
  esEventoProximoPublico,
} from "@/lib/utils/evento-utils"

interface UpcomingEventsProps {
  hasError?: boolean
}

export function UpcomingEvents({ hasError = false }: UpcomingEventsProps) {
  const { eventos, loading, cargarEventos, filtros, setFiltros, pagination } = useEventosPublicos()
  const sectionRef = useRef<HTMLElement>(null)
  const previousLoadingRef = useRef(loading)

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(() => pagination?.currentPage ?? 1)
  const itemsPerPage = pagination?.limit ?? filtros.limit ?? 12
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil((pagination?.total ?? eventos.length) / itemsPerPage))

  // Cargar eventos al montar el componente
  useEffect(() => {
    if (!loading && eventos.length === 0) {
      cargarEventos(filtros)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincronizar página local con la del backend
  useEffect(() => {
    if (pagination?.currentPage && pagination.currentPage !== currentPage) {
      setCurrentPage(pagination.currentPage)
    }
  }, [pagination?.currentPage])

  useEffect(() => {
    const terminoCarga = previousLoadingRef.current && !loading

    if (terminoCarga && eventos.length > 0 && sectionRef.current) {
      const esPrimeraCarga = sessionStorage.getItem('eventos_initial_load') === null

      if (!esPrimeraCarga) {
        setTimeout(() => {
          sectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 100)
      } else {
        sessionStorage.setItem('eventos_initial_load', 'true')
      }
    }

    previousLoadingRef.current = loading
  }, [loading, eventos.length])

  // Handlers de paginación
  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages))
    if (nextPage === currentPage) return

    const newSkip = (nextPage - 1) * itemsPerPage
    const nextFilters = { ...filtros, skip: newSkip, limit: itemsPerPage }

    setCurrentPage(nextPage)
    setFiltros(nextFilters)
    cargarEventos(nextFilters)

    setTimeout(() => {
      sectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  if (loading) {
    return (
      <section ref={sectionRef} className="w-full px-0">
        <div className="space-y-8">
          <div className="px-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold">Todos los Eventos</h2>
              <p className="text-lg text-muted-foreground">
                Cargando eventos disponibles...
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (eventos.length === 0) {
    return (
      <section ref={sectionRef} className="w-full px-0">
        <div className="space-y-8">
          <div className="px-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold">Todos los Eventos</h2>
              <p className="text-lg text-muted-foreground">
                {hasError
                  ? "Error en los servidores. Por favor, intenta nuevamente más tarde."
                  : "No hay eventos disponibles en este momento"}
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="w-full py-16">
      <div className="container mx-auto px-4">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-3">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Todos los Eventos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {hasError
                ? "Error en los servidores. Por favor, intenta nuevamente más tarde."
                : `Descubre todos los eventos disponibles`}
            </p>
          </div>

          {/* Grid de eventos - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {eventos.map((evento) => {
              const id = evento.evento_id;
              return (
                <Link key={id} href={`/evento/${id}`}>
                  <div className="group cursor-pointer">
                    <div className="space-y-4">
                      <div className="relative overflow-hidden rounded-xl shadow-lg">
                        <img
                          src={obtenerImagenEventoPublico(evento)}
                          alt={evento.nombre}
                          className="w-full h-[280px] object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Badges */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                            {obtenerCategoriaPublica(evento)}
                          </Badge>
                        </div>
                        {esEventoProximoPublico(evento.fecha_hora_inicio) && (
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                              ¡Próximamente!
                            </Badge>
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="space-y-3 px-1">
                        <h3 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {evento.nombre}
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span className="line-clamp-1">{formatearFecha(evento.fecha_hora_inicio)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="line-clamp-1">
                              {obtenerUbicacionPublica(evento)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <nav
              role="navigation"
              aria-label="Paginación"
              className="flex items-center justify-center py-4"
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  aria-label="Ir a la página anterior"
                  aria-disabled={currentPage === 1}
                  className="pagination-button px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
                >
                  Anterior
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Calcular qué páginas mostrar (centradas en la página actual)
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        aria-label={`Ir a la página ${pageNum}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={`pagination-button w-10 h-10 text-sm font-medium rounded-md cursor-pointer flex items-center justify-center transition-colors duration-150 ${isCurrent ? 'pagination-current' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  aria-label="Ir a la página siguiente"
                  aria-disabled={currentPage === totalPages}
                  className="pagination-button px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
                >
                  Siguiente
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}
