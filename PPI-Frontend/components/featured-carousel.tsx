"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { eventosService } from "@/lib/api/services/eventos"
import { EventoPublicResponse } from "@/lib/types/entities/evento"
import { 
  formatearFecha, 
  obtenerUbicacionPublica,
  obtenerImagenEventoPublico,
  obtenerCategoriaPublica
} from "@/lib/utils/evento-utils"

interface FeaturedCarouselProps {
  hasError?: boolean
}

export function FeaturedCarousel({ hasError = false }: FeaturedCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [eventosDestacados, setEventosDestacados] = useState<EventoPublicResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar eventos destacados SOLO una vez, independiente de los filtros
  useEffect(() => {
    const cargarEventosDestacados = async () => {
      try {
        setLoading(true)
        const response = await eventosService.listarPublicos({ skip: 0, limit: 3 })
        if (response.success && response.data) {
          setEventosDestacados(response.data)
        }
      } catch (error) {
        console.error('Error cargando eventos destacados:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarEventosDestacados()
  }, []) // Solo se ejecuta una vez al montar
  

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % eventosDestacados.length)
  }, [eventosDestacados.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + eventosDestacados.length) % eventosDestacados.length)
  }, [eventosDestacados.length])

  // Auto-advance carousel
  useEffect(() => {
    if (eventosDestacados.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % eventosDestacados.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [eventosDestacados.length])

  if (loading) {
    return (
      <section className="container mx-auto px-4 mt-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-balance">
            Encuentra los mejores eventos en Lima
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            Cargando eventos destacados...
          </p>
        </div>
      </section>
    )
  }

  if (eventosDestacados.length === 0) {
    return (
      <section className="container mx-auto px-4 mt-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-balance">
            Encuentra los mejores eventos en Lima
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            {hasError 
              ? "Error en los servidores. Por favor, intenta nuevamente más tarde."
              : "No hay eventos disponibles en este momento"}
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="container mx-auto px-4 mt-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-balance">
            Encuentra los mejores eventos en Lima
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            {hasError 
              ? "Error en los servidores. Por favor, intenta nuevamente más tarde."
              : "Descubre conciertos, obras de teatro, eventos deportivos y mucho más"}
          </p>
        </div>
      </section>

      {/* Carrusel ocupa todo el ancho */}
      <section className="relative w-full mt-10">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {eventosDestacados.map((evento) => {
              const id = evento.evento_id ?? evento.evento_id;
              return (
                <div key={id} className="w-full flex-shrink-0">
                <div className="relative h-[80vh]"> 
                  <img
                    src={obtenerImagenEventoPublico(evento)}
                    alt={evento.nombre}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />

                  
                  <div className="absolute left-8 md:left-16 lg:left-24 top-1/2 -translate-y-1/2 space-y-6 z-10 max-w-xl lg:max-w-2xl">
                    <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-emerald-600 text-white">
                      {obtenerCategoriaPublica(evento)}
                    </span>
                    
                    <div className="space-y-4">
                      <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg leading-tight">
                        {evento.nombre}
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-200 drop-shadow-md">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          <span className="text-lg">{formatearFecha(evento.fecha_hora_inicio)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          <span className="text-lg">{obtenerUbicacionPublica(evento)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Link href={`/evento/${id}`}>
                      <Button
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg px-8 py-3 text-lg cursor-pointer"
                      >
                        Ver evento
                      </Button>
                    </Link>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles del carrusel */}
        {eventosDestacados.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white cursor-pointer"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white cursor-pointer"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Indicadores */}
            <div className="flex justify-center gap-3 mt-6 pb-8">
              {eventosDestacados.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 cursor-pointer ${
                    index === currentSlide ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}

