import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, PowerOff } from "lucide-react"
import type { SortConfig, SortField } from "../utils/locales-filters"
import type { LocalDisplay } from "@/lib/types/entities/local"
import { SortableTableHeadLocales } from "./SortableTableHeadLocales"

interface LocalesTableProps {
  locales: LocalDisplay[]
  onAction: (action: string, local: LocalDisplay) => void
  sortConfig: SortConfig
  onSort: (field: SortField) => void
  onRowClick?: (id: number) => void
  selectedId?: number | null
}

// Función para obtener el color del badge según el tipo de local
const getTipoLocalColor = (tipo: string) => {
  const tipoLower = tipo.toLowerCase()
  
  if (tipoLower.includes('teatro') || tipoLower.includes('auditorio')) {
    return "bg-purple-100 text-purple-800 border-purple-200"
  }
  if (tipoLower.includes('estadio') || tipoLower.includes('cancha') || tipoLower.includes('deportivo')) {
    return "bg-green-100 text-green-800 border-green-200"
  }
  if (tipoLower.includes('centro') || tipoLower.includes('convenciones') || tipoLower.includes('conferencias')) {
    return "bg-blue-100 text-blue-800 border-blue-200"
  }
  if (tipoLower.includes('sala') || tipoLower.includes('evento')) {
    return "bg-orange-100 text-orange-800 border-orange-200"
  }
  if (tipoLower.includes('club') || tipoLower.includes('bar') || tipoLower.includes('discoteca')) {
    return "bg-pink-100 text-pink-800 border-pink-200"
  }
  if (tipoLower.includes('parque') || tipoLower.includes('plaza') || tipoLower.includes('aire libre')) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200"
  }
  
  // Color por defecto
  return "bg-indigo-100 text-indigo-800 border-indigo-200"
}

export function LocalesTable({ 
  locales, 
  onAction,
  sortConfig,
  onSort,
  onRowClick,
  selectedId
}: LocalesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Locales Registrados ({locales.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Nombre</TableHead>
                <TableHead className="text-center" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Tipo</TableHead>
                <TableHead className="w-[300px]" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Ubicación</TableHead>
                <SortableTableHeadLocales 
                  field="capacidad"
                  label="Capacidad"
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
                <TableHead className="text-center" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Estado</TableHead>
                <SortableTableHeadLocales 
                  field="fecha"
                  label="Fecha Registro"
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
                <TableHead className="text-center" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locales.map((local) => (
                <TableRow
                  key={local.id}
                  onClick={onRowClick ? () => onRowClick(local.id) : undefined}
                  className={onRowClick ? `cursor-pointer ${selectedId === local.id ? 'bg-blue-50' : ''}` : undefined}
                >
                  <TableCell className="font-medium w-[350px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="line-clamp-2 cursor-help">{local.nombre}</p>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{local.nombre}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`min-w-[90px] justify-center ${getTipoLocalColor(local.tipo)}`}
                    >
                      {local.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[400px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="font-medium line-clamp-2">{local.distrito}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{local.direccion}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div>
                          <p className="font-medium">{local.distrito}</p>
                          <p className="text-sm">{local.direccion}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">{local.capacidad.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={local.estado === "Activo" ? "default" : "destructive"}
                      className={`min-w-[80px] justify-center ${local.estado === "Activo" ? "bg-green-100 text-green-800" : ""}`}
                    >
                      {local.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{local.fechaRegistro}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem 
                          onClick={() => onAction("visualizar", local)}
                          className="cursor-pointer group"
                        >
                          <Eye className="mr-2 h-4 w-4 group-hover:text-white" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onAction("editar", local)}
                          className="cursor-pointer group"
                        >
                          <Edit className="mr-2 h-4 w-4 group-hover:text-white" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onAction("desactivar", local)}
                          className="cursor-pointer group hover:bg-destructive hover:text-destructive-foreground transition-colors duration-150"
                        >
                          <PowerOff className="mr-2 h-4 w-4 group-hover:text-white" />
                          {local.estado === "Activo" ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {locales.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron locales que coincidan con los filtros.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}