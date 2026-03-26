"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Search, MapPin, Calendar, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/lib/hooks/shared"
import { useEventosPublicos } from "@/lib/stores/eventos-store"
import { useFiltrosData } from "@/lib/hooks/home/use-filtros-data"
import { EventosPublicosParams } from "@/lib/api/services/eventos/eventos"
import { eventosService } from "@/lib/api/services/eventos/eventos"
import { EventoPublicResponse } from "@/lib/types/entities/evento"
import {
  formatearFecha,
  obtenerUbicacionPublica,
  obtenerImagenEventoPublico,
  obtenerCategoriaPublica,
} from "@/lib/utils/evento-utils"
import Link from "next/link"

export function SearchSection() {
  const { cargarEventos } = useEventosPublicos()
  const { categorias, distritos, loading: loadingFiltros } = useFiltrosData()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDistrict, setSelectedDistrict] = useState("all")
  const [selectedDate, setSelectedDate] = useState("")

  // Estados para el dropdown de búsqueda
  const [searchResults, setSearchResults] = useState<EventoPublicResponse[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Buscar para el dropdown (independiente de los filtros)
  useEffect(() => {
    const buscarEnDropdown = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
        setLoadingSearch(true)
        try {
          const response = await eventosService.listarPublicos({
            busqueda: debouncedSearchQuery.trim(),
            skip: 0,
            limit: 8 // Máximo 8 resultados en el dropdown
          })

          if (response.success && response.data) {
            setSearchResults(response.data)
            setShowDropdown(response.data.length > 0)
          }
        } catch (error) {
          console.error('Error buscando eventos:', error)
          setSearchResults([])
          setShowDropdown(false)
        } finally {
          setLoadingSearch(false)
        }
      } else {
        setSearchResults([])
        setShowDropdown(false)
        setLoadingSearch(false)
      }
    }

    buscarEnDropdown()
  }, [debouncedSearchQuery])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Memoizar los filtros para evitar recrear objeto en cada render
  // NOTA: La búsqueda de texto NO se incluye aquí, solo afecta al dropdown
  const filtros = useMemo<EventosPublicosParams>(() => {
    const params: EventosPublicosParams = {
      skip: 0,
      limit: 12
    }

    if (selectedCategory !== "all") {
      params.categoria_id = parseInt(selectedCategory)
    }

    if (selectedDistrict !== "all") {
      params.distrito_id = parseInt(selectedDistrict)
    }

    if (selectedDate) {
      params.fecha_inicio = selectedDate
    }

    return params
  }, [selectedCategory, selectedDistrict, selectedDate])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    cargarEventos(filtros)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros])

  const handleClearFilters = useCallback(() => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedDistrict("all")
    setSelectedDate("")
    setShowDropdown(false)
    setSearchResults([])
  }, [])

  return (
    <section className="container mx-auto px-4 pt-8">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Eventos Destacados</h2>
          <p className="text-muted-foreground">Los eventos más populares de la temporada</p>
        </div>

        <div className="space-y-4">
          {/* Buscador principal con dropdown */}
          <div className="relative max-w-2xl mx-auto" ref={dropdownRef}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5 z-10" />
            <Input
              placeholder="Buscar eventos, artistas, lugares..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className="pl-12 pr-4 py-6 text-lg rounded-full border-2 bg-white"
            />

            {/* Dropdown de resultados de búsqueda */}
            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-gray-100 max-h-[500px] overflow-y-auto z-50">
                <div className="p-2">
                  {loadingSearch ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span>Buscando eventos...</span>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((evento) => {
                      const id = evento.evento_id
                      return (
                        <Link
                          key={id}
                          href={`/evento/${id}`}
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                            {/* Imagen compacta */}
                            <img
                              src={obtenerImagenEventoPublico(evento)}
                              alt={evento.nombre}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform"
                            />

                            {/* Info del evento */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                {evento.nombre}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {formatearFecha(evento.fecha_hora_inicio)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {obtenerUbicacionPublica(evento)}
                                </span>
                              </div>
                            </div>

                            {/* Badge de categoría */}
                            <Badge className="bg-primary text-white text-xs px-2 py-1 flex-shrink-0">
                              {obtenerCategoriaPublica(evento)}
                            </Badge>
                          </div>
                        </Link>
                      )
                    })
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl p-6 space-y-4 max-w-4xl mx-auto shadow-sm">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  Fecha
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-primary text-white h-10 pl-3 pr-10 cursor-pointer transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white h-4 w-4 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  Distrito
                </label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={loadingFiltros}>
                  <SelectTrigger className="h-10 bg-primary text-white cursor-pointer hover:border-orange-500 transition-colors">
                    <SelectValue placeholder={loadingFiltros ? "Cargando..." : "Todos los distritos"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="all"
                      className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                    >
                      Todos los distritos
                    </SelectItem>
                    {distritos.map((distrito) => (
                      <SelectItem
                        key={distrito.distrito_id}
                        value={distrito.distrito_id.toString()}
                        className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                      >
                        {distrito.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-600" />
                  Categoría
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loadingFiltros}>
                  <SelectTrigger className="h-10 bg-primary text-white cursor-pointer hover:border-orange-500 transition-colors">
                    <SelectValue placeholder={loadingFiltros ? "Cargando..." : "Todas las categorías"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="all"
                      className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                    >
                      Todas las categorías
                    </SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem
                        key={categoria.categoria_evento_id}
                        value={categoria.categoria_evento_id.toString()}
                        className="hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-colors duration-150"
                      >
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium h-10 px-6 py-2 shadow-sm transition-all border hover:bg-gray-50 hover:border-orange-500 cursor-pointer"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  borderColor: "#d1d5db",
                }}
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
