"use client"

import { Heart, Star, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useEventos, useEventosLoading } from "@/lib/stores/eventos-store"
import { 
  formatearFecha, 
  obtenerUbicacionPublica,
  obtenerImagenEventoPublico,
  obtenerCategoriaPublica,
  esEventoTrendingPublico
} from "@/lib/utils/evento-utils"
export function RecommendedEvents() {
  const eventos = useEventos()
  const loading = useEventosLoading()
  
  // Usar eventos desde índice 3 al 9 del cache
  const eventosRecomendados = eventos.slice(3, 9)

  if (loading) {
    return (
      <section className="container mx-auto px-4">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">También te puede interesar</h2>
            <p className="text-muted-foreground">Cargando recomendaciones...</p>
          </div>
        </div>
      </section>
    )
  }

  if (eventosRecomendados.length === 0) {
    return (
      <section className="container mx-auto px-4">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">También te puede interesar</h2>
            <p className="text-muted-foreground">No hay eventos recomendados disponibles</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              También te puede interesar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Basado en tus preferencias y eventos populares
            </p>
          </div>

          {/* Grid de eventos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eventosRecomendados.map((evento) => (
              <Link key={evento.evento_id} href={`/evento/${evento.evento_id}`}>
                <div className="group cursor-pointer">
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl shadow-lg">
                      <img
                        src={obtenerImagenEventoPublico(evento)}
                        alt={evento.nombre}
                        className="w-full h-[280px] object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                          {obtenerCategoriaPublica(evento)}
                        </Badge>
                        {esEventoTrendingPublico(evento) && (
                          <Badge className="bg-orange-500 text-white text-sm px-3 py-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white h-8 w-8">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 px-1">
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {evento.nombre}
                      </h3>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">4.5</span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatearFecha(evento.fecha_hora_inicio)}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {obtenerUbicacionPublica(evento)}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-bold text-primary">
                          {obtenerCategoriaPublica(evento)}
                        </span>
                        <Button size="sm" className="text-sm">
                          Ver evento
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Ver más */}
          <div className="text-center">
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              Ver más recomendaciones
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
