"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, Eye, Edit, MoreHorizontal, PowerOff } from "lucide-react"
import type { Evento } from "@/lib/types/evento"
import type { SortConfig, SortField } from "../utils/eventos-filters"
import { SortableTableHead } from "./SortableTableHead"

interface EventosTableProps {
  eventos: Evento[]
  handleAction: (action: string, evento: Evento) => void
  getCategoriaNombre: (categoriaId: number) => string
  sortConfig: SortConfig
  onSort: (field: SortField) => void
}

export function EventosTable({ 
  eventos, 
  handleAction, 
  getCategoriaNombre,
  sortConfig,
  onSort
}: EventosTableProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos Registrados ({eventos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Evento</TableHead>
                <TableHead className="text-center" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Categoría</TableHead>
                <SortableTableHead 
                  field="fecha"
                  label="Fecha"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  className="text-center"
                />
                <TableHead style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Lugar</TableHead>
                <TableHead className="text-center" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Estado</TableHead>
                <TableHead className="text-right" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow 
                  key={evento.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <TableCell className="font-medium w-[500px]">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-100">
                        {evento.icono && (
                          <img
                            src={evento.icono}
                            alt={evento.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                parent.style.display = 'none'
                              }
                            }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-bold truncate cursor-help">{evento.nombre}</p>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>{evento.nombre}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground line-clamp-2 cursor-help">{evento.descripcion}</p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-md">
                            <p>{evento.descripcion}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="min-w-[100px] justify-center">{getCategoriaNombre(evento.categoria_evento_id)}</Badge>
                  </TableCell>
                  <TableCell className="">
                    <div className="flex items-center justify-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(evento.fecha_hora_inicio).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evento.fecha_hora_inicio).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{evento.local_nombre || 'Sin local'}</TableCell>
                  
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`min-w-[100px] justify-center ${
                        evento.estado === "Publicado" ? "bg-green-200 text-green-800 border-green-200" : 
                        evento.estado === "Proximamente" ? "bg-purple-200 text-purple-800 border-purple-200" : 
                        evento.estado === "Borrador" ? "bg-gray-200 text-gray-800 border-gray-200" : 
                        evento.estado === "Finalizado" ? "bg-sky-200 text-sky-800 border-sky-200" :
                        evento.estado === "Cancelado" ? "bg-red-200 text-red-800 border-red-200" :
                        "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {evento.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleAction("visualizar", evento)}
                          className="cursor-pointer group"
                        >
                          <Eye className="mr-2 h-4 w-4 group-hover:text-white" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAction("editar", evento)}
                          className="cursor-pointer group"
                        >
                          <Edit className="mr-2 h-4 w-4 group-hover:text-white" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAction("cambiar-estado", evento)}
                          className="cursor-pointer group"
                        >
                          <PowerOff className="mr-2 h-4 w-4 group-hover:text-white" />
                          Cambiar estado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {eventos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron eventos que coincidan con los filtros.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}