import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PowerOff } from "lucide-react"
import type { UsuarioDisplay } from "@/lib/types/entities/usuario"
import type { SortConfig, SortField } from "../utils/usuarios-filters"
import { SortableTableHeadUsuarios } from "./SortableTableHeadUsuarios"

interface UsuariosTableProps {
    usuarios: UsuarioDisplay[]
    onAction: (action: string, usuario: UsuarioDisplay) => void
    onRowClick?: (id: number) => void
    selectedId?: number | null
    sortConfig: SortConfig
    onSort: (field: SortField) => void
    isActionLoading?: boolean
}

export function UsuariosTable({ usuarios, onAction, onRowClick, selectedId, sortConfig, onSort, isActionLoading }: UsuariosTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Usuarios Registrados ({usuarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableTableHeadUsuarios
                                    field="nombres"
                                    label="Nombres"
                                    sortConfig={sortConfig}
                                    onSort={onSort}
                                    align="left"
                                    className="w-[200px]"
                                />
                                <SortableTableHeadUsuarios
                                    field="apellidos"
                                    label="Apellidos"
                                    sortConfig={sortConfig}
                                    onSort={onSort}
                                    align="left"
                                    className="w-[200px]"
                                />
                                <TableHead className="w-[150px]" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>DNI</TableHead>
                                <TableHead className="w-[150px]" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Teléfono</TableHead>
                                <TableHead className="w-[250px]" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Correo</TableHead>
                                <TableHead className="text-center" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Estado</TableHead>
                                <SortableTableHeadUsuarios
                                    field="fecha"
                                    label="Fecha Registro"
                                    sortConfig={sortConfig}
                                    onSort={onSort}
                                    className="w-[150px]"
                                />
                                <TableHead className="text-center" style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usuarios.map((usuario) => (
                                <TableRow
                                    key={usuario.id}
                                    onClick={onRowClick ? () => onRowClick(usuario.id) : undefined}
                                    className={onRowClick ? `cursor-pointer ${selectedId === usuario.id ? 'bg-blue-50' : ''}` : undefined}
                                >
                                    <TableCell className="font-medium">{usuario.nombres}</TableCell>
                                    <TableCell>{usuario.apellidos}</TableCell>
                                    <TableCell>{usuario.numero_documento}</TableCell>
                                    <TableCell>{usuario.telefono}</TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <p className="line-clamp-1 cursor-help">{usuario.email}</p>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                                <p>{usuario.email}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={usuario.activo ? "default" : "destructive"}
                                            className={`min-w-[80px] justify-center ${usuario.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                        >
                                            {usuario.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {usuario.fecha_creacion
                                            ? new Date(usuario.fecha_creacion).toLocaleDateString('es-PE')
                                            : ''}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant={usuario.activo ? "deactivate" : "activate"}
                                            className="h-8 min-w-[8rem] justify-start gap-1 px-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-80"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onAction("desactivar", usuario)
                                            }}
                                            disabled={isActionLoading}
                                        >
                                            <PowerOff className="h-4 w-4" />
                                            {usuario.activo ? "Desactivar" : "Activar"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {usuarios.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No se encontraron usuarios que coincidan con los filtros.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
